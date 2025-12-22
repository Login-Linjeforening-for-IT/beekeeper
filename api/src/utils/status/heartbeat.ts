import run from '#db'
import { loadSQL } from '#utils/loadSQL.ts'
import notify from './notify.ts'

type Bar = {
    status: boolean
    delay: number
    expectedDown: boolean
    timestamp: string
}

type DetailedService = {
    id: number
    uptime: number
    type: string
    name: string
    enabled: boolean
    tags: { id: number, name: string }[]
    bars: Bar[]
    url: string
    status: boolean
    expected_down: boolean
    user_agent: string | null
    interval: number
    note: string
    max_consecutive_failures: number
}

export default async function monitor() {
    const uncheckedResult = await run(`SELECT * FROM status WHERE type = 'fetch' AND enabled = TRUE`)
    const uncheckedServices = uncheckedResult.rows as DetailedService[]
    for (const service of uncheckedServices) {
        const check = await fetchService(service)
        await run(`
            INSERT INTO status_details (service_id, status, expected_down, delay, note)
            VALUES ($1, $2, $3, $4, $5)
        `, [service.id, check.status, service.expected_down, check.delay, service.note ?? null])
    }

    const query = await loadSQL('fetchServiceStatus.sql')
    const result = await run(query)
    const services: CheckedServiceStatus[] = result.rows
    for (const service of services) {
        if (!service.notification_webhook) {
            return
        }

        if (!service.status && !service.max_consecutive_failures && !service.notified) {
            await notify(service)
            await run(`UPDATE status SET notified = NOW() WHERE id = $1`, [service.service_id])
        }

        if (service.status && service.notified) {
            await notify(service)
            await run(`UPDATE status SET notified = NULL WHERE id = $1`, [service.service_id])
        }

        // handle advanced case with consecutive failures (notify down)
    }
}

async function fetchService(service: DetailedService): Promise<{ status: boolean, delay: number }> {
    const start = new Date().getTime()
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 3000)

    try {
        const headers: HeadersInit = {}

        if (service.user_agent) {
            headers['User-Agent'] = service.user_agent
        }

        const response = await fetch(service.url, {
            signal: controller.signal,
            headers
        })

        if (!response.ok) {
            return { status: false, delay: new Date().getTime() - start }
        }

        return { status: true, delay: new Date().getTime() - start }
    } catch (error) {
        console.log(`Monitor error for service ${service.name}: ${error}`)
        return { status: false, delay: new Date().getTime() - start }
    } finally {
        clearTimeout(timeout)
    }
}

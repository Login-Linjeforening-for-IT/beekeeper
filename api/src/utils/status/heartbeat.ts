import config from '#constants'
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
    const uncheckedResult = await run('SELECT * FROM status WHERE type = \'fetch\' AND enabled = TRUE')
    const uncheckedServices = uncheckedResult.rows as DetailedService[]
    await runInParallel(uncheckedServices, async (service) => {
        if (
            !Array.isArray(service.bars)
            || !service.bars.length
            || (new Date().getTime() - new Date(service.bars[0].timestamp).getTime() > service.interval * 1000)
        ) {
            const check = await recheck(service)

            await run(`
                INSERT INTO status_details (service_id, status, expected_down, delay, note)
                VALUES ($1, $2, $3, $4, $5)
            `, [service.id, check.status, service.expected_down, check.delay, service.note ?? null])
        }
    })

    const query = await loadSQL('fetchServiceStatus.sql')
    const result = await run(query)
    const services: CheckedServiceStatus[] = result.rows
    for (const service of services) {
        if (!service.notification_webhook) {
            continue
        }

        if (!service.bars[0].status && !service.max_consecutive_failures && !service.notified) {
            await notify(service)
            await run('UPDATE status SET notified = NOW() WHERE id = $1', [service.id])
            continue
        }

        if (service.bars[0].status && service.notified) {
            await notify(service)
            await run('UPDATE status SET notified = NULL WHERE id = $1', [service.id])
            continue
        }

        if (!service.notified && service.max_consecutive_failures > 0 && !service.bars[0].status) {
            const recentBars = service.bars.slice(0, service.max_consecutive_failures)
            let downCount = 0
            for (const bar of recentBars) {
                if (!bar.status) {
                    downCount++
                } else {
                    break
                }
            }

            if (downCount >= service.max_consecutive_failures) {
                await notify(service)
                await run('UPDATE status SET notified = NOW() WHERE id = $1', [service.id])
            }

            continue
        }
    }
}

async function recheck(service: DetailedService): Promise<{ status: boolean, delay: number }> {
    const start = Date.now()

    for (let i = 0; i < config.MAX_ATTEMPTS; i++) {
        const check = await fetchService(service)

        if (check.status) {
            return {
                status: check.status,
                delay: Date.now() - start
            }
        }

        if (i < config.MAX_ATTEMPTS - 1) {
            const jitter = 1000 + Math.random() * 1000
            await new Promise(r => setTimeout(r, jitter))
        }
    }

    return { status: false, delay: Date.now() - start }
}

async function runInParallel<T>(
    items: T[],
    worker: (item: T) => Promise<void>
) {
    const queue = [...items]

    const workers = Array.from({ length: config.MAX_CONCURRENCY }, async () => {
        while (true) {
            const item = queue.shift()
            if (!item) {
                break
            }

            try {
                await worker(item)
            } catch (error) {
                console.error(`Worker error: ${error}`)
            }
        }
    })

    await Promise.all(workers)
}

async function fetchService(service: DetailedService): Promise<{ status: boolean, delay: number }> {
    const start = new Date().getTime()
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)

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

import config from '#constants'

export default async function heartbeat() {
    try {
        const ping = await getPing()
        const url = config.HEARTBEAT_URL
            .replace('{reference}', config.HEARTBEAT_REFERENCE || '')
            .replace('{ping}', String(ping))

        if (!url) {
            throw new Error('Missing heartbeat url.')
        }

        const response = await fetch(url)
        if (!response.ok) {
            throw new Error(await response.text())
        }

        const now = new Date().toLocaleString('nb-NO', {
            timeZone: 'Europe/Oslo',
        })

        const data = await response.json()
        console.log(`🐝 Heartbeat ${now}`, data)
        return data
    } catch (error) {
        console.log(error)
    }
}

async function getPing() {
    const baseUrl = config.HEARTBEAT_URL.split('/push')[0]
    if (!baseUrl) {
        throw new Error('Missing heartbeat URL.')
    }

    const start = performance.now()
    const response = await fetch(baseUrl)
    if (!response.ok) {
        console.log(await response.text())
    }

    const end = performance.now()
    const ping = Math.round(end - start)
    return ping
}

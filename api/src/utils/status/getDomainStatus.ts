import debug from '#utils/debug.ts'

export default async function getDomainStatus(domain: Domain) {
    if (domain.url.includes('beekeeper')) {
        return { ...domain, status: 200 }
    }

    const fetchAbleDomain = domain.url.includes('http')
        ? domain.url
        : domain.url.includes(',')
            ? `https://${domain.url.split(',')[0]}`
            : `https://${domain.url}`

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 1000)

    try {
        const response = await fetch(fetchAbleDomain, { signal: controller.signal })
        return { ...domain, status: response.status }
    } catch (error) {
        debug({ detailed: `Error while fetching domain status in fetchDomainStatus for domain ${domain}: ${(error as Error).message}` })
        return { ...domain, status: 503, error: (error as Error).message }
    } finally {
        clearTimeout(timeoutId)
    }
}

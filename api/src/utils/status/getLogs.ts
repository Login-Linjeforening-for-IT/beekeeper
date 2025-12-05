import debug from '#utils/debug.ts'

type LogParams = {
    path: 'global' | 'local'
    page: number
    resultsPerPage?: number
    namespace?: string
    context?: string
    search?: string
}

type Log = {
    page: number
    resultsPerPage: number
    pages: number
    results: (LocalLog | GlobalLog)[]
    error?: string
}

type GlobalLog = {
    id: string
    name: string
    event: string
    status: string
    command: string
    timestamp: string
}

export default async function getLogs({
    path,
    page,
    namespace,
    context,
    search,
    resultsPerPage
}: LogParams): Promise<Log> {
    const baseUrl = `http://localhost:8080/api/log/${path}`
    const params = new URLSearchParams({ page: String(page) })
    const isGlobal = namespace === 'global'

    if (resultsPerPage) {
        params.set('resultsPerPage', String(resultsPerPage))
    }

    if (!isGlobal && namespace) {
        params.set('namespace', namespace)
    }

    if (context) {
        params.set('context', context)
    }

    if (search) {
        params.set('search', search)
    }

    const url = `${baseUrl}?${params.toString()}`
    debug({
        basic: `Fetching logs from ${url}`,
        detailed: `Fetching logs from ${url}`,
    })

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        })

        if (!response.ok) {
            const data = await response.json()
            debug({ detailed: { message: `Fetching logs from ${url} failed`, data } })
            throw Error(data.error)
        }

        const services = await response.json()
        debug({ full: { message: `Fetching logs with url ${url} completed successfully`, data: services } })
        return services
    } catch (error) {
        debug({ production: { message: `Fetching logs from ${url} failed`, error: error as object } })
        return {
            page: 1,
            pages: 1,
            resultsPerPage: 0,
            error: `Fetching logs from ${url} failed`,
            results: []
        }
    }
}

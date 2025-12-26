import alertSlowQuery from '#utils/alertSlowQuery.ts'
import preloadStatus from '#utils/status/preload.ts'
import type { FastifyInstance } from 'fastify'

export default async function refreshQueries(fastify: FastifyInstance) {
    const start = Date.now()
    const status: Status = await preloadStatus()
    const duration = (Date.now() - start) / 1000
    alertSlowQuery(duration, 'cache')
    fastify.status = Buffer.from(JSON.stringify(status))
}

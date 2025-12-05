import alertSlowQuery from '#utils/alertSlowQuery.ts'
import config from '#constants'
import fp from 'fastify-plugin'
import { preloadStatus } from '#utils/status/preload.ts'

export default fp(async (fastify) => {
    async function refreshQueries() {
        const start = Date.now()
        const status: Status = await preloadStatus()
        const duration = (Date.now() - start) / 1000
        alertSlowQuery(duration, 'cache')
        fastify.status = Buffer.from(JSON.stringify(status))
        fastify.log.info('Status refreshed')
    }

    refreshQueries()
    setInterval(refreshQueries, config.CACHE_TTL)
})

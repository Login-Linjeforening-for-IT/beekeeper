import config from '#constants'
import fp from 'fastify-plugin'
import refreshQueries from './fp/refreshQueries.ts'
import refreshInternalDashboard from './fp/refreshInternalDashboard.ts'

export default fp(async (fastify) => {
    async function refresh() {
        refreshQueries(fastify)
        refreshInternalDashboard(fastify)
        fastify.log.info('Queries refreshed')
    }

    refresh()
    setInterval(refresh, config.cache.ttl)
})

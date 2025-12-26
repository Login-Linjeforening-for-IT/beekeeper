import preloadInternalDashboard from '#utils/dashboard/internal/preloadInternalDashboard.ts'
import type { FastifyInstance } from 'fastify'

export default async function refreshInternalDashboard(fastify: FastifyInstance) {
    const internalDashboard: InternalDashboard = await preloadInternalDashboard()
    fastify.internalDashboard = Buffer.from(JSON.stringify(internalDashboard))
}

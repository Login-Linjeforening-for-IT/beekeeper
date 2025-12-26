import 'fastify'

declare module 'fastify' {
    interface FastifyInstance {
        status: Buffer
        favicon: Buffer
        internalDashboard: Buffer
    }
}

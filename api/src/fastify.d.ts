import 'fastify'

declare module 'fastify' {
    interface FastifyInstance {
        status: Buffer
    }
}

import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'

export default async function getInternalDashboard(
    this: FastifyInstance,
    _: FastifyRequest,
    res: FastifyReply
) {
    res.type('application/json').send(this.internalDashboard)
}

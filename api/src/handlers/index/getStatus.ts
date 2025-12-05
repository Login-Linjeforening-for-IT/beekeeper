import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'

export default function getActivity(
    this: FastifyInstance,
    _request: FastifyRequest,
    reply: FastifyReply
) {
    reply.type('application/json').send(this.status)
}

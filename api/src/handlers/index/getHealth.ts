import type { FastifyReply, FastifyRequest } from 'fastify'

/**
 * Health check for the API
 * @param _ FastifyRequest, not used
 * @param res FastifyReply, used to send the response to the user
 */
export default async function getHealthHandler(_: FastifyRequest, res: FastifyReply) {
    res.send(200)
}

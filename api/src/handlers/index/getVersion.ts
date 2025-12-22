import config from '../../../package.json' with { type: 'json' }
import type { FastifyReply, FastifyRequest } from 'fastify'

export default function getVersion(_: FastifyRequest, res: FastifyReply) {
    return res.send(config.version)
}

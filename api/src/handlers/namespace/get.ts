import type { FastifyReply, FastifyRequest } from 'fastify'
import data from '#utils/getNamespaces.ts'
import debug from '#utils/debug.ts'

export default async function getNamespaces(_: FastifyRequest, res: FastifyReply) {
    try {
        return res.send(await data())
    } catch (error) {
        debug({ basic: `Database error in getNamespaces: ${JSON.stringify(error)}` })
        return res.status(500).send({ error: "Internal Server Error" })
    }
}

import type { FastifyReply, FastifyRequest } from 'fastify'
import run from "#db"
import debug from '#utils/debug.ts'

export default async function getNamespaces(_: FastifyRequest, res: FastifyReply) {
    try {
        const result = await run(`SELECT * FROM namespaces ORDER BY name ASC`)

        return res.send(result.rows)
    } catch (error) {
        debug({ basic: `Database error in getNamespaces: ${JSON.stringify(error)}` })
        return res.status(500).send({ error: "Internal Server Error" })
    }
}

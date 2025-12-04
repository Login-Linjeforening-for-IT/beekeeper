import type { FastifyReply, FastifyRequest } from 'fastify'
import run from "#db"
import debug from '#utils/debug.ts'

export default async function getContexts(_: FastifyRequest, res: FastifyReply) {
    try {
        const result = await run(`SELECT * FROM contexts ORDER BY name;`)

        return res.send(result.rows)
    } catch (error) {
        debug({ basic: `Database error in getContexts: ${JSON.stringify(error)}` })
        return res.status(500).send({ error: "Internal Server Error" })
    }
}

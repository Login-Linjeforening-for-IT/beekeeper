import type { FastifyReply, FastifyRequest } from 'fastify'
import run from '#db'
import debug from '#utils/debug.ts'
import { loadSQL } from '#utils/loadSQL.ts'

export default async function getStatus(_: FastifyRequest, res: FastifyReply) {
    try {
        const query = await loadSQL('fetchService.sql')
        const result = await run(query)
        return res.send(result.rows)
    } catch (error) {
        debug({ basic: `Database error in getStatus: ${JSON.stringify(error)}` })
        return res.status(500).send({ error: 'Internal Server Error' })
    }
}

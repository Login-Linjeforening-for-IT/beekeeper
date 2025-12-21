import type { FastifyReply, FastifyRequest } from 'fastify'
import run from '#db'
import debug from '#utils/debug.ts'

export default async function getSites(req: FastifyRequest, res: FastifyReply) {
    const { id } = req.params as { id: string }
    try {
        const result = await run(`SELECT * FROM sites;`, [id])
        return res.send(result.rows)
    } catch (error) {
        debug({ basic: `Database error in getSites: ${JSON.stringify(error)}` })
        return res.status(500).send({ error: 'Internal Server Error' })
    }
}

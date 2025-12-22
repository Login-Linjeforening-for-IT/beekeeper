import type { FastifyReply, FastifyRequest } from 'fastify'
import run from '#db'
import debug from '#utils/debug.ts'

export default async function getService(req: FastifyRequest, res: FastifyReply) {
    try {
        const { id } = req.params as { id: string }
        const result = await run(`SELECT * FROM status WHERE id = $1;`, [id])
        return res.send(result.rowCount ? result.rows[0] : [])
    } catch (error) {
        debug({ basic: `Database error in getService: ${JSON.stringify(error)}` })
        return res.status(500).send({ error: 'Internal Server Error' })
    }
}

import type { FastifyReply, FastifyRequest } from 'fastify'
import run from '#db'

export default async function getDomains(req: FastifyRequest, res: FastifyReply) {
    try {
        const result = await run(`SELECT DISTINCT domain FROM traffic ORDER BY domain`)

        const domains = result.rows.map(row => row.domain)
        return res.status(200).send({ domains })
    } catch (error) {
        return res.status(500).send({ error: 'Internal Server Error' })
    }
}
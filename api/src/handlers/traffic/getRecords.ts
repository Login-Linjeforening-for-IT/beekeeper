import type { FastifyReply, FastifyRequest } from 'fastify'
import run from '#db'

type GetRecordsParams = {
    time_start?: Date
    time_end?: Date
    limit?: number
    page?: number
}

export default async function getRecords(req: FastifyRequest, res: FastifyReply) {
    const { time_start, time_end, limit, page } = req.params as GetRecordsParams || {}

    const oneWeekMs = 7 * 24 * 60 * 60 * 1000

    try {
        const params = [
            (time_start || new Date(Date.now() - oneWeekMs)).toISOString(),
            (time_end || new Date()).toISOString()
        ]

        const offset = ((page || 1) - 1) * (limit || 50)
        const limitValue = limit || 50

        const dataQuery = run(
            `SELECT * FROM traffic
             WHERE timestamp BETWEEN $1 AND $2
             ORDER BY timestamp DESC
             LIMIT $3 OFFSET $4`,
            [...params, limitValue, offset]
        )

        const countQuery = run(
            `SELECT COUNT(*) AS c FROM traffic
             WHERE timestamp BETWEEN $1 AND $2`,
            params
        )

        const [result, total] = await Promise.all([dataQuery, countQuery])

        const totalCount = Number(total.rows[0]?.c || 0)
        return res.status(200).send({ result: result.rows, total: totalCount })

    } catch (error) {
        return res.status(500).send({ error: 'Internal Server Error' })
    }
}
import type { FastifyReply, FastifyRequest } from 'fastify'
import run from '#db'

type GetRecordsParams = {
    time_start?: string
    time_end?: string
    limit?: string | number
    page?: string | number
}

export default async function getRecords(req: FastifyRequest, res: FastifyReply) {
    const { time_start, time_end, limit, page } = req.query as GetRecordsParams || {}

    const oneWeekMs = 7 * 24 * 60 * 60 * 1000

    try {
        const startDate = time_start ? new Date(String(time_start)) : new Date(Date.now() - oneWeekMs)
        const endDate = time_end ? new Date(String(time_end)) : new Date()
        const params = [startDate.toISOString(), endDate.toISOString()]

        const pageNumber = Number(page) > 0 ? Number(page) : 1
        let limitValue = Number(limit) > 0 ? Number(limit) : 50
        const maxLimit = 1000
        if (limitValue > maxLimit) limitValue = maxLimit
        const offset = (pageNumber - 1) * limitValue

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
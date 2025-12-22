import type { FastifyReply, FastifyRequest } from 'fastify'
import run from '#db'

type GetRecordsParams = {
    time_start?: string
    time_end?: string
    limit?: string | number
    page?: string | number
    domain?: string
}

export default async function getRecords(req: FastifyRequest, res: FastifyReply) {
    const { time_start, time_end, limit, page, domain } = req.query as GetRecordsParams || {}

    const oneWeekMs = 7 * 24 * 60 * 60 * 1000

    try {
        const startDate = time_start && !Number.isNaN(new Date(String(time_start)).getTime())
            ? new Date(String(time_start))
            : new Date(Date.now() - oneWeekMs)
        const endDate = time_end && !Number.isNaN(new Date(String(time_end)).getTime())
            ? new Date(String(time_end))
            : new Date()

        const pageNumber = Math.max(Number(page) || 1, 1)
        const limitValue = Math.min(Math.max(Number(limit) || 50, 1), 1000)
        const offset = (pageNumber - 1) * limitValue

        const params: (string | number)[] = [startDate.toISOString(), endDate.toISOString()]
        let whereClause = 'WHERE timestamp BETWEEN $1 AND $2'
        if (domain) {
            whereClause += ' AND domain = $3'
            params.push(domain)
        }

        const countQuery = run(
            `SELECT COUNT(*) AS c FROM traffic ${whereClause}`,
            params
        )

        const dataParams = [...params, limitValue, offset]
        const limitIndex = params.length + 1
        const offsetIndex = params.length + 2

        const dataQuery = run(
            `SELECT * FROM traffic
             ${whereClause}
             ORDER BY timestamp DESC
             LIMIT $${limitIndex} OFFSET $${offsetIndex}`,
            dataParams
        )

        const [result, total] = await Promise.all([dataQuery, countQuery])

        const totalCount = Number(total.rows[0]?.c || 0)
        return res.status(200).send({ result: result.rows, total: totalCount })

    } catch (error) {
        console.log(error)
        return res.status(500).send({ error: 'Internal Server Error' })
    }
}

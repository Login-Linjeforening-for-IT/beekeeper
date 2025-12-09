import type { FastifyReply, FastifyRequest } from 'fastify'
import run from '#db'

type GetMetricsParams = {
    time_start?: string
    time_end?: string
    domain?: string
}

export default async function getMetrics(req: FastifyRequest, res: FastifyReply) {
    const { time_start, time_end, domain } = req.query as GetMetricsParams || {}

    const oneWeekMs = 7 * 24 * 60 * 60 * 1000
    let startDate = time_start ? new Date(String(time_start)) : new Date(Date.now() - oneWeekMs)
    let endDate = time_end ? new Date(String(time_end)) : new Date()
    if (Number.isNaN(startDate.getTime())) startDate = new Date(Date.now() - oneWeekMs)
    if (Number.isNaN(endDate.getTime())) endDate = new Date()
    try {
        const params = [startDate.toISOString(), endDate.toISOString()]
        let whereClause = "WHERE timestamp BETWEEN $1 AND $2"
        if (domain) {
            whereClause += " AND domain = $3"
            params.push(domain)
        }

        const result = await run(
            `SELECT 
                COUNT(*) AS total_requests,
                AVG(request_time) AS avg_request_time,
                COALESCE(SUM(CASE WHEN status >= 400 THEN 1 ELSE 0 END)::float / NULLIF(COUNT(*), 0), 0) AS error_rate,
                (SELECT jsonb_agg(jsonb_build_object('key', status, 'count', count) ORDER BY count DESC) FROM (
                    SELECT status, COUNT(*) AS count
                    FROM traffic
                    ${whereClause}
                    GROUP BY status
                    ORDER BY count DESC
                    LIMIT 5
                ) AS status_counts) AS top_status_codes,
                (SELECT jsonb_agg(jsonb_build_object('key', method, 'count', count) ORDER BY count DESC) FROM (
                    SELECT method, COUNT(*) AS count
                    FROM traffic
                    ${whereClause}
                    GROUP BY method
                    ORDER BY count DESC
                    LIMIT 5
                ) AS method_counts) AS top_methods,
                (SELECT jsonb_agg(jsonb_build_object('key', domain, 'count', count) ORDER BY count DESC) FROM (
                    SELECT domain, COUNT(*) AS count
                    FROM traffic
                    ${whereClause}
                    GROUP BY domain
                    ORDER BY count DESC
                    LIMIT 5
                ) AS domain_counts) AS top_domains,
                (SELECT jsonb_agg(jsonb_build_object('key', os, 'count', count) ORDER BY count DESC) FROM (
                    SELECT 
                        CASE
                            WHEN user_agent ILIKE '%Windows%' THEN 'Windows'
                            WHEN user_agent ILIKE '%Macintosh%' THEN 'MacOS'
                            WHEN user_agent ILIKE '%Linux%' THEN 'Linux'
                            WHEN user_agent ILIKE '%Android%' THEN 'Android'
                            WHEN user_agent ILIKE '%iPhone%' OR user_agent ILIKE '%iPad%' THEN 'iOS'
                            ELSE 'Other'
                        END AS os,
                        COUNT(*) AS count
                    FROM traffic
                    ${whereClause}
                    GROUP BY os
                    ORDER BY count DESC
                    LIMIT 5
                ) AS os_counts) AS top_os
            FROM traffic
            ${whereClause}`,
            params
        )

        return res.status(200).send(result.rows[0])

    } catch (error) {
        return res.status(500).send({ error: 'Internal Server Error' })
    }
}
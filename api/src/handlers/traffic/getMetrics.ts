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

    if (Number.isNaN(startDate.getTime())) {
        startDate = new Date(Date.now() - oneWeekMs)
    }

    if (Number.isNaN(endDate.getTime())) {
        endDate = new Date()
    }

    const durationMs = endDate.getTime() - startDate.getTime()
    const isHourly = durationMs < 24 * 60 * 60 * 1000

    try {
        const params = [startDate.toISOString(), endDate.toISOString()]
        let whereClause = 'WHERE timestamp BETWEEN $1 AND $2'
        if (domain) {
            whereClause += ' AND domain = $3'
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
                (SELECT jsonb_agg(jsonb_build_object('key', path, 'count', count) ORDER BY count DESC) FROM (
                    SELECT path, COUNT(*) AS count
                    FROM traffic
                    ${whereClause}
                    GROUP BY path
                    ORDER BY count DESC
                    LIMIT 5
                ) AS path_counts) AS top_paths,
                (SELECT jsonb_agg(jsonb_build_object('key', path, 'avg_time', avg_time) ORDER BY avg_time DESC) FROM (
                    SELECT path, AVG(request_time) AS avg_time
                    FROM traffic
                    ${whereClause}
                    GROUP BY path
                    ORDER BY avg_time DESC
                    LIMIT 5
                ) AS path_avg_times) AS top_slow_paths,
                (SELECT jsonb_agg(jsonb_build_object('key', path, 'count', error_count) ORDER BY error_count DESC) FROM (
                    SELECT path, COUNT(*) AS error_count
                    FROM traffic
                    ${whereClause} AND status >= 400
                    GROUP BY path
                    ORDER BY error_count DESC
                    LIMIT 5
                ) AS error_path_counts) AS top_error_paths,
                (SELECT jsonb_agg(jsonb_build_object('key', os, 'count', count) ORDER BY count DESC) FROM (
                    SELECT 
                        CASE
                            WHEN user_agent ILIKE '%Windows%' THEN 'Windows'
                            WHEN user_agent ILIKE '%Macintosh%' OR user_agent ILIKE '%macOS%' THEN 'MacOS'
                            WHEN user_agent ILIKE '%Linux%' THEN 'Linux'
                            WHEN user_agent ILIKE '%Android%' THEN 'Android'
                            WHEN user_agent ILIKE '%iPhone%' OR user_agent ILIKE '%iPad%' THEN 'iOS'
                            WHEN user_agent ILIKE '%Postman%' THEN 'Postman'
                            WHEN user_agent ILIKE '%Thunder Client%' THEN 'Thunder Client'
                            WHEN user_agent ILIKE '%node%' THEN 'Node.js'
                            ELSE 'Other'
                        END AS os,
                        COUNT(*) AS count
                    FROM traffic
                    ${whereClause}
                    GROUP BY os
                    ORDER BY count DESC
                    LIMIT 5
                ) AS os_counts) AS top_os,
                (SELECT jsonb_agg(jsonb_build_object('key', browser, 'count', count) ORDER BY count DESC) FROM (
                    SELECT 
                        CASE
                            WHEN user_agent ILIKE '%Chrome%' AND user_agent NOT ILIKE '%Edg%' THEN 'Chrome'
                            WHEN user_agent ILIKE '%Firefox%' THEN 'Firefox'
                            WHEN user_agent ILIKE '%Safari%' AND user_agent NOT ILIKE '%Chrome%' THEN 'Safari'
                            WHEN user_agent ILIKE '%Edg%' THEN 'Edge'
                            ELSE 'Other'
                        END AS browser,
                        COUNT(*) AS count
                    FROM traffic
                    ${whereClause}
                    GROUP BY browser
                    ORDER BY count DESC
                    LIMIT 5
                ) AS browser_counts) AS top_browsers,
                (SELECT jsonb_agg(jsonb_build_object('key', time_bucket::text, 'count', count) ORDER BY time_bucket) FROM (
                    SELECT date_trunc('${isHourly ? 'hour' : 'day'}', timestamp) AS time_bucket, COUNT(*) AS count
                    FROM traffic
                    ${whereClause}
                    GROUP BY time_bucket
                    ORDER BY time_bucket
                ) AS time_split) AS requests_over_time
            FROM traffic
            ${whereClause}`,
            params
        )

        return res.status(200).send(result.rows[0])

    } catch (error) {
        return res.status(500).send({ error: 'Internal Server Error' })
    }
}
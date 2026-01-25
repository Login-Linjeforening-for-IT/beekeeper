import type { FastifyReply, FastifyRequest } from 'fastify'
import run from '#db'
import debug from '#utils/debug.ts'

export default async function getService(req: FastifyRequest, res: FastifyReply) {
    try {
        const { id } = req.params as { id: string }
        const result = await run('SELECT * FROM status WHERE id = $1;', [id])
        if (!result.rowCount) {
            return res.status(404).send({ error: 'Service not found.' })
        }

        const row = result.rows[0] as MonitoredService
        const service = {
            id: row.id,
            name: row.name,
            type: row.type,
            url: row.url,
            notification: row.notification,
            interval: row.interval,
            expectedDown: row.expected_down,
            upsideDown: row.upside_down,
            userAgent: row.user_agent,
            maxConsecutiveFailures: row.max_consecutive_failures,
            note: row.note,
            notified: row.notified,
            tags: row.tags,
            enabled: row.enabled
        }

        return res.send(service)
    } catch (error) {
        debug({ basic: `Database error in getService: ${JSON.stringify(error)}` })
        return res.status(500).send({ error: 'Internal Server Error' })
    }
}

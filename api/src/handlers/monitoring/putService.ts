import type { FastifyReply, FastifyRequest } from 'fastify'
import run from '#db'
import tokenWrapper from '#utils/tokenWrapper.ts'
import debug from '#utils/debug.ts'

type PutStatusBody = {
    name: string
    type: 'fetch' | 'post'
    url: string
    interval: number
    status: boolean
    expectedDown: boolean
    maxConsecutiveFailures: number
    note: string
    enabled: boolean
    notification?: number
    userAgent?: string
}

export default async function putService(req: FastifyRequest, res: FastifyReply) {
    const { id } = req.params as { id: string }
    const {
        name, type, url, interval, expectedDown, userAgent,
        maxConsecutiveFailures, note, enabled, notification
    } = req.body as PutStatusBody || {}
    const { valid } = await tokenWrapper(req, res)
    if (!valid) {
        return res.status(400).send({ error: 'Unauthorized' })
    }

    if (!name || !type || (type === 'fetch' && !url) || !interval || typeof expectedDown !== 'boolean'
        || typeof maxConsecutiveFailures !== 'number' || typeof enabled !== 'boolean') {
        return res.status(400).send({ error: 'Missing required field.' })
    }

    try {
        debug({
            detailed: `
            Updating service: id=${id}, name=${name}, type=${type}, url=${url}, 
            interval=${interval}, expected_down=${expectedDown}, 
            max_consecutive_failures=${maxConsecutiveFailures}, note=${note}, 
            enabled=${enabled}, notification=${notification}, user_agent=${userAgent}
        ` })

        const result = await run(
            `
            UPDATE status
            SET
                name = $1,
                type = $2,
                url = $3,
                interval = $4,
                expected_down = $5,
                max_consecutive_failures = $6,
                note = $7,
                enabled = $8,
                notification = $9,
                user_agent = $11
            WHERE id = $10
            RETURNING id
            `,
            [
                name, type, url, interval, expectedDown, maxConsecutiveFailures,
                note, enabled, Number(notification) || null, id, userAgent || null
            ]
        )

        if (result.rowCount === 0) {
            return res.status(404).send({ error: 'Service not found.' })
        }

        return res.send({ message: `Successfully updated service ${name} (${id}).` })
    } catch (error) {
        debug({ basic: `Database error in putService: ${JSON.stringify(error)}` })
        return res.status(500).send({ error: 'Internal Server Error' })
    }
}

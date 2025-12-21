import type { FastifyReply, FastifyRequest } from 'fastify'
import run from '#db'
import tokenWrapper from '#utils/tokenWrapper.ts'
import debug from '#utils/debug.ts'

type PostStatusBody = {
    name: string
    type: 'fetch' | 'post'
    url: string
    interval: number
    status: boolean
    expectedDown: boolean
    maxConsecutiveFailures: number
    note: string
    enabled: boolean
}

export default async function postService(req: FastifyRequest, res: FastifyReply) {
    const {
        name, type, url, interval, expectedDown,
        maxConsecutiveFailures, note, enabled
    } = req.body as PostStatusBody || {}
    const { valid } = await tokenWrapper(req, res)
    if (!valid) {
        return res.status(400).send({ error: 'Unauthorized' })
    }

    if (!name || !type || !url || !interval || typeof expectedDown !== 'boolean'
        || typeof maxConsecutiveFailures !== 'number' || !note || typeof enabled !== 'boolean') {
        return res.status(400).send({ error: 'Missing required field.' })
    }

    try {
        debug({
            detailed: `
            Adding service: name=${name}, type=${type}, url=${url}, 
            interval=${interval}, expected_down=${expectedDown}, 
            max_consecutive_failures=${maxConsecutiveFailures}, note=${note}, 
            enabled=${enabled}
        ` })

        await run(
            `INSERT INTO status (name, type, url, interval, expected_down, max_consecutive_failures, note, enabled) 
             SELECT $1, $2, $3, $4, $5, $6, $7, $8
             WHERE NOT EXISTS (SELECT 1 FROM status WHERE name = $1);`,
            [name, type, url, interval, expectedDown, maxConsecutiveFailures, note, enabled]
        )

        return res.send({ message: `Successfully added context ${name} to contexts.` })
    } catch (error) {
        debug({ basic: `Database error in postContext: ${JSON.stringify(error)}` })
        return res.status(500).send({ error: 'Internal Server Error' })
    }
}

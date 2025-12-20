import type { FastifyReply, FastifyRequest } from 'fastify'
import run from '#db'
import tokenWrapper from '#utils/tokenWrapper.ts'
import debug from '#utils/debug.ts'

type PostStatusUpdateBody = {
    id: number
    expectedDown: boolean
    status: boolean
    delay: number
    note: string
    timestamp: string
}

export default async function postStatusUpdate(req: FastifyRequest, res: FastifyReply) {
    const { id } = req.params as { id: string }
    const { expectedDown, status, delay, note, timestamp } = req.body as PostStatusUpdateBody || {}
    const { valid } = await tokenWrapper(req, res)
    if (!valid) {
        return res.status(400).send({ error: 'Unauthorized' })
    }

    if (!id || typeof expectedDown !== 'boolean' || !status || !delay || !note || !timestamp) {
        return res.status(400).send({ error: 'Missing required field.' })
    }

    try {
        debug({
            detailed: `
            Posting status: id=${id}, expectedDown=${expectedDown}, status=${status}, 
            delay=${delay}, note=${note}, timestamp=${timestamp}
        ` })

        await run(
            `INSERT INTO status_details (id, expected_down, status, delay, note, timestamp) 
             SELECT $1, $2, $3, $4, $5, $6;`,
            [id, expectedDown, status, delay, note, timestamp]
        )

        return res.send({ message: `Successfully updated status to ${status ? 'up' : 'down'} for id ${id}.` })
    } catch (error) {
        debug({ basic: `Database error in postUpdate: ${JSON.stringify(error)}` })
        return res.status(500).send({ error: 'Internal Server Error' })
    }
}

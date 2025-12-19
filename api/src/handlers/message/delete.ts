import type { FastifyReply, FastifyRequest } from 'fastify'
import run from '#db'
import tokenWrapper from '#utils/tokenWrapper.ts'
import debug from '#utils/debug.ts'

export default async function deleteMessage(req: FastifyRequest, res: FastifyReply) {
    const { id } = req.params as { id: string }
    const { valid } = await tokenWrapper(req, res)
    if (!valid) {
        return res.status(400).send({ error: 'Unauthorized' })
    }

    try {
        const result = await run(`DELETE FROM messages WHERE id = $1`, [id])

        return res.send(result.rows)
    } catch (error) {
        debug({ basic: `Database error in deleteMessage: ${JSON.stringify(error)}` })
        return res.status(500).send({ error: 'Internal Server Error' })
    }
}

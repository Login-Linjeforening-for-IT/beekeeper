import type { FastifyReply, FastifyRequest } from 'fastify'
import run from '#db'
import debug from '#utils/debug.ts'

export default async function deleteStatusNotification(req: FastifyRequest, res: FastifyReply) {
    const { id } = req.params as { id: string }
    try {
        const result = await run('DELETE from status_notifications WHERE id = $1;', [id])
        return res.send(result.rows)
    } catch (error) {
        debug({ basic: `Database error in deleteNotification: ${JSON.stringify(error)}` })
        return res.status(500).send({ error: 'Internal Server Error' })
    }
}

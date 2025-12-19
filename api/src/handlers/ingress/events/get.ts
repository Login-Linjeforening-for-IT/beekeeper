import type { FastifyReply, FastifyRequest } from 'fastify'
import run from '#db'
import debug from '#utils/debug.ts'

export default async function getIngressEvents(req: FastifyRequest, res: FastifyReply) {
    const { context, namespace, name } = req.params as { context: string, namespace: string, name: string }
    try {
        const result = await run(`SELECT * FROM namespace_ingress_events WHERE context = $1 AND namespace = $2 AND name = $3 ORDER BY name;`,
            [context, namespace, name]
        )

        return res.send(result.rows)
    } catch (error) {
        debug({ basic: `Database error in getIngressEvents: ${JSON.stringify(error)}` })
        return res.status(500).send({ error: 'Internal Server Error' })
    }
}

import type { FastifyReply, FastifyRequest } from 'fastify'
import run from "#db"
import debug from '#utils/debug.ts'

export default async function getNamespaceDomainsByNamespace(req: FastifyRequest, res: FastifyReply) {
    const { context, namespace } = req.params as { context: string, namespace: string }
    try {
        const result = await run(
            `SELECT * FROM namespace_domains WHERE context = $1 AND namespace = $2 ORDER BY name;`,
            [context, namespace]
        )

        return res.send(result.rows)
    } catch (error) {
        debug({ basic: `Database error in getNamespaceDomainsByNamespace: ${JSON.stringify(error)}` })
        return res.status(500).send({ error: "Internal Server Error" })
    }
}

import type { FastifyReply, FastifyRequest } from 'fastify'
import run from "#db"
import debug from '#utils/debug.ts'

type PostNamespaceIncidentProps = {
    name: string
    url: string
    context: string
    namespace: string
    timestamp: string
}

export default async function postNamespaceIncident(req: FastifyRequest, res: FastifyReply) {
    const { name, url, context, namespace, timestamp } = req.body as PostNamespaceIncidentProps || {}
    if (!name || !url || !context || !namespace || !timestamp) {
        return res.status(400).send({ error: "Missing name, url, context, namespace or timestamp." })
    }

    try {
        debug({ basic: `Adding incident: name=${name} url=${url}, context=${context}, namespace=${namespace}, timestamp=${timestamp}` })

        await run(
            `INSERT INTO namespace_incidents (context, name, namespace, url, timestamp)
            SELECT $1, $2, $3, $4, $5;`,
            [context, name, namespace, url, timestamp]
        )

        return res.send({ message: `Successfully added incident ${name} with url ${url} at time ${timestamp} for namespace ${namespace} in context ${context}.` })
    } catch (error) {
        debug({ basic: `Database error in postNamespaceIncident: ${JSON.stringify(error)}` })
        return res.status(500).send({ error: "Internal Server Error" })
    }
}

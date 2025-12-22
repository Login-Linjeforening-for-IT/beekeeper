import type { FastifyReply, FastifyRequest } from 'fastify'
import run from '#db'
import debug from '#utils/debug.ts'

type PutNamespaceIncidentProps = {
    id: string
    name: string
    url: string
    context: string
    namespace: string
    timestamp: string
}

export default async function putNamespaceIncident(req: FastifyRequest, res: FastifyReply) {
    const { id, name, url, context, namespace, timestamp } = req.body as PutNamespaceIncidentProps || {}
    if (!id || !name || !url || !context || !namespace || !timestamp) {
        return res.status(400).send({ error: 'Missing id, name, url, context or namespace.' })
    }

    const exists = await run('SELECT * FROM namespace_incidents WHERE id = $1', [id])
    if (!exists.rows.length) {
        return res.status(404).send({ error: `Incident ${id} not found.` })
    }

    try {
        debug({ basic: `Updating incident: id=${id} name=${name} url=${url}, context=${context}, namespace=${namespace}` })

        await run(
            `UPDATE namespace_incidents
            SET context = $1, name = $2, namespace = $3, url = $4, timestamp = $5
            WHERE id = $1;`,
            [id, context, name, namespace, url, timestamp]
        )

        return res.send({ message: `Successfully updated incident with id ${id}, name ${name} and timestamp ${timestamp} with url ${url} for namespace ${namespace} in context ${context}.` })
    } catch (error) {
        debug({ basic: `Database error in putNamespaceIncident: ${JSON.stringify(error)}` })
        return res.status(500).send({ error: 'Internal Server Error' })
    }
}

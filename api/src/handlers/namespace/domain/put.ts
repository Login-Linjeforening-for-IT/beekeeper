import type { FastifyReply, FastifyRequest } from 'fastify'
import run from '#db'
import debug from '#utils/debug.ts'

type PutNamespaceDomainProps = {
    id: string
    name: string
    url: string
    context: string
    namespace: string
}

export default async function putNamespaceDomain(req: FastifyRequest, res: FastifyReply) {
    const { id, name, url, context, namespace } = req.body as PutNamespaceDomainProps || {}
    if (!id || !name || !url || !context || !namespace) {
        return res.status(400).send({ error: 'Missing id, name, url, context or namespace.' })
    }

    const exists = await run(`SELECT * FROM namespace_domains WHERE id = $1`, [id])
    if (!exists.rows.length) {
        return res.status(404).send({ error: `Domain ${url} not found for ${namespace} in ${context}.` })
    }

    try {
        debug({ basic: `Updating domain: id=${id} name=${name} url=${url}, context=${context}, namespace=${namespace}` })

        await run(
            `UPDATE namespace_domains 
            SET context = $1, name = $2, namespace = $3, url = $4
            WHERE id = $1;`,
            [id, context, name, namespace, url]
        )

        return res.send({ message: `Successfully updated id ${id} name ${name} with url ${url} for namespace ${namespace} in context ${context}.` })
    } catch (error) {
        debug({ basic: `Database error in putNamespaceDomain: ${JSON.stringify(error)}` })
        return res.status(500).send({ error: 'Internal Server Error' })
    }
}

import type { FastifyReply, FastifyRequest } from 'fastify'
import run from "#db"
import debug from '#utils/debug.ts'

type PostNamespaceDomainsProps = {
    name: string
    url: string
    context: string
    namespace: string
}

export default async function postNamespaceDomains(req: FastifyRequest, res: FastifyReply) {
    const { name, url, context, namespace } = req.body as PostNamespaceDomainsProps || {}
    if (!name || !url || !context || !namespace) {
        return res.status(400).send({ error: "Missing name, url, context or namespace." })
    }

    try {
        debug({ basic: `Adding domain: name=${name} url=${url}, context=${context}, namespace=${namespace}` })

        await run(
            `INSERT INTO namespace_domains (context, name, namespace, url)
            SELECT $1, $2, $3, $4;`,
            [context, name, namespace, url]
        )

        return res.send({ message: `Successfully added name ${name} with url ${url} for namespace ${namespace} in context ${context}.` })
    } catch (error) {
        debug({ basic: `Database error in postNamespaceDomains: ${JSON.stringify(error)}` })
        return res.status(500).send({ error: "Internal Server Error" })
    }
}

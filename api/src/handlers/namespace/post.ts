
import type { FastifyReply, FastifyRequest } from 'fastify'
import run from "#db"
import tokenWrapper from "#utils/tokenWrapper.ts"
import debug from '#utils/debug.ts'

type PostNamespaceProps = {
    name: string,
    status: string,
    service_status: string,
    age: string
}

export default async function postNamespace(req: FastifyRequest, res: FastifyReply) {
    const { name, status, service_status, age } = req.body as PostNamespaceProps || {}
    const { valid } = await tokenWrapper(req, res)
    if (!valid) {
        return res.status(400).send({ error: "Unauthorized" })
    }

    if (!name || !status || !service_status || !age) {
        return res.status(400).send({ error: "Missing name, status, service_status or age." })
    }

    try {
        debug({ basic: `Adding namespace: name=${name}, status=${status}, service_status=${service_status}, age=${age}` })

        await run(
            `INSERT INTO namespaces (name, status, service_status, age) 
             SELECT $1, $2, $3, $4;`,
            [name, status, service_status, age]
        )

        return res.send({ message: `Successfully added namespace ${name}.` })
    } catch (error) {
        debug({ basic: `Database error in postNamespace: ${JSON.stringify(error)}` })
        return res.status(500).send({ error: "Internal Server Error" })
    }
}

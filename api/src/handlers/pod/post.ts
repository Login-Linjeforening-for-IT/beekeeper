import type { FastifyReply, FastifyRequest } from 'fastify'
import run from "#db"
import tokenWrapper from "#utils/tokenWrapper.ts"
import debug from '#utils/debug.ts'

type PostPodProps = {
    name: string
    ready: string
    status: string
    restarts: string
    age: string
    context: string
    namespace: string
}

export default async function postPod(req: FastifyRequest, res: FastifyReply) {
    const { name, ready, status, restarts, age, context, namespace } = req.body as PostPodProps || {}
    const { valid } = await tokenWrapper(req, res)
    if (!valid) {
        return res.status(400).send({ error: "Unauthorized" })
    }

    if (!name || !ready || !status || !restarts || !age || !context || !namespace) {
        return res.status(400).send({ error: "Missing pod name." })
    }

    try {
        debug({ basic: `Adding pod: name=${name} ready=${ready}, status=${status}, restarts=${restarts} age=${age}, context=${context}, namespace=${namespace}` })

        await run(
            `INSERT INTO pods (name, ready, status, restarts, age, context, namespace) 
             SELECT $1, $2, $3, $4, $5, $6, $7
             WHERE NOT EXISTS (SELECT 1 FROM pods WHERE name = $1);`,
            [name]
        )

        return res.send({ message: `Successfully added pod ${name}.` })
    } catch (error) {
        debug({ basic: `Database error in postPod: ${JSON.stringify(error)}` })
        return res.status(500).send({ error: "Internal Server Error" })
    }
}

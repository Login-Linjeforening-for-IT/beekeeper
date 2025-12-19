import type { FastifyReply, FastifyRequest } from 'fastify'
import run from '#db'
import tokenWrapper from '#utils/tokenWrapper.ts'
import debug from '#utils/debug.ts'

type PostLocalCommandProps = {
    context: string
    name: string
    namespace: string
    command: string
    author: string
    reason: string
}

export default async function postLocalCommand(req: FastifyRequest, res: FastifyReply) {
    const { context, name, namespace, command, author, reason } = req.body as PostLocalCommandProps || {}
    const { valid } = await tokenWrapper(req, res)
    if (!valid) {
        return res.status(400).send({ error: 'Unauthorized' })
    }

    if (!context || !name || !namespace || !command || !author || !reason) {
        return res.status(400).send({ error: 'Missing context, name, namespace, command, author or reason.' })
    }

    try {
        debug({ basic: `Adding local command: context=${context}, namespace=${name}, command=${command}, author=${author}, reason=${reason}` })

        await run(
            `INSERT INTO local_commands (context, name, namespace, command, author, reason) 
             SELECT $1, $2, $3, $4, $5, $6
             WHERE NOT EXISTS (SELECT 1 FROM local_commands WHERE context = $1 AND name = $3 AND command = $2);`,
            [context, name, namespace, command, author, reason]
        )

        return res.send({ message: `Successfully added local command ${name} for namespace ${namespace} in context ${context}.` })
    } catch (error) {
        debug({ basic: `Database error in postLocalCommand: ${JSON.stringify(error)}` })
        return res.status(500).send({ error: 'Internal Server Error' })
    }
}

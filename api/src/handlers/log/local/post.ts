import type { FastifyReply, FastifyRequest } from 'fastify'
import run from '#db'
import tokenWrapper from '#utils/tokenWrapper.ts'
import debug from '#utils/debug.ts'

type PostLocalLogBody = {
    context: string
    name: string
    event: string
    command: string
    app: string
    pod: string
    status: string
}

export default async function postLocalLog(req: FastifyRequest, res: FastifyReply) {
    const { context, name, event, command, app, pod, status } = req.body as PostLocalLogBody || {}
    const { valid } = await tokenWrapper(req, res)
    if (!valid) {
        return res.status(400).send({ error: 'Unauthorized' })
    }

    if (!context || !name || !event || !command || !status) {
        return res.status(400).send({ error: 'Missing context, name, event, command, app, pod or status.' })
    }

    try {
        debug({ basic: `Adding to local log: context=${context} name=${name}, event=${event}, command=${command}, status=${status}, app=${app}, pod=${pod}` })

        await run(
            `INSERT INTO local_log (context, name, event, command, app, pod, status) 
             SELECT $1, $2, $3, $4, $5, $6, $7;`,
            [context, name, event, command, app || null, pod || null, status]
        )

        return res.send({ message: `Successfully added event ${event} to the log for namespace ${name} in context ${context}.` })
    } catch (error) {
        debug({ basic: `Database error in postLocalLog: ${JSON.stringify(error)}` })
        return res.status(500).send({ error: 'Internal Server Error' })
    }
}

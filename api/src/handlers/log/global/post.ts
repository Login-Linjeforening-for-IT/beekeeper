import type { FastifyReply, FastifyRequest } from 'fastify'
import run from "#db"
import tokenWrapper from "#utils/tokenWrapper.ts"
import debug from '#utils/debug.ts'

type PostGlobalLogBody = {
    name: string
    event: string
    status: string
    command: string
}

export default async function postGlobalLog(req: FastifyRequest, res: FastifyReply) {
    const { name, event, command, status } = req.body as PostGlobalLogBody || {}
    const { valid } = await tokenWrapper(req, res)
    if (!valid) {
        return res.status(400).send({ error: "Unauthorized" })
    }

    if (!name || !event || !command || !status) {
        return res.status(400).send({ error: "Missing name, event, command or status." })
    }

    try {
        debug({ basic: `Adding global log: name=${name}, event=${event}, command=${command} status=${status}` })

        await run(
            `INSERT INTO global_log (name, event, command, status) 
             SELECT $1, $2, $3, $4;`,
            [name, event, command, status]
        )

        return res.send({ message: `Successfully added event ${event} to the global log with name ${name}.` })
    } catch (error) {
        debug({ basic: `Database error in postGlobalLog: ${JSON.stringify(error)}` })
        return res.status(500).send({ error: "Internal Server Error" })
    }
}

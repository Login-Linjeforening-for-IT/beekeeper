import type { FastifyReply, FastifyRequest } from 'fastify'
import run from "#db"
import tokenWrapper from "#utils/tokenWrapper.ts"
import debug from '#utils/debug.ts'

export default async function postGlobalCommand(req: FastifyRequest, res: FastifyReply) {
    const { name, command, author, reason } = req.body as { name: string, command: string, author: string, reason: string } || {}
    const { valid } = await tokenWrapper(req, res)
    if (!valid) {
        return res.status(400).send({ error: "Unauthorized" })
    }

    if (!name || !command || !author || !reason) {
        return res.status(400).send({ error: "Missing name, command, author or reason." })
    }

    try {
        debug({ basic: `Adding global command: name=${name} command=${command}, author=${author}, reason=${reason}` })

        await run(
            `INSERT INTO global_commands (name, command, author, reason) 
             SELECT $1, $2, $3, $4
             WHERE NOT EXISTS (SELECT 1 FROM global_commands WHERE command = $2);`,
            [name, command, author, reason]
        )

        return res.send({ message: `Successfully added global command: ${name}.` })
    } catch (error) {
        debug({ basic: `Database error in postGlobalCommand: ${JSON.stringify(error)}` })
        return res.status(500).send({ error: "Internal Server Error" })
    }
}

import type { FastifyReply, FastifyRequest } from 'fastify'
import run from '#db'
import debug from '#utils/debug.ts'

export default async function getGlobalCommands(_: FastifyRequest, res: FastifyReply) {
    try {
        const commands = await run(`SELECT * FROM global_commands`)

        return res.send(commands.rows)
    } catch (error) {
        debug({ basic: `Database error in getGlobalCommands: ${JSON.stringify(error)}` })
        return res.status(500).send({ error: 'Internal Server Error' })
    }
}

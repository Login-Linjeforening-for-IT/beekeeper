import type { FastifyReply, FastifyRequest } from 'fastify'
import run from "#db"
import debug from '#utils/debug.ts'

export default async function getLocalCommands(_: FastifyRequest, res: FastifyReply) {
    try {
        const commands = await run(`SELECT * FROM local_commands`)

        return res.send(commands.rows)
    } catch (error) {
        debug({ basic: `Database error in getLocalCommands: ${JSON.stringify(error)}` })
        return res.status(500).send({ error: "Internal Server Error" })
    }
}

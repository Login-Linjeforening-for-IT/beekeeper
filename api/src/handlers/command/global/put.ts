import type { FastifyReply, FastifyRequest } from 'fastify'
import run from '#db'
import debug from '#utils/debug.ts'

type PutGlobalCommandProps = {
    id: string
    name: string
    command: string
    author: string
    reason: string
}

export default async function putGlobalCommand(req: FastifyRequest, res: FastifyReply) {
    const { id, name, command, author, reason } = req.body as PutGlobalCommandProps || {}
    if (!id || !name || !command || !author || !reason) {
        return res.status(400).send({ error: 'Missing id, name, command, author or reason.' })
    }

    const exists = await run(`SELECT * FROM global_commands WHERE id = $1`, [id])
    if (!exists.rows.length) {
        return res.status(404).send({ error: `ID ${id} not found.` })
    }

    try {
        debug({ detailed: `Editing global command: id=${id} name=${name} command=${command}, author=${author}, reason=${reason}` })

        await run(
            `UPDATE global_commands 
             SET name = $1, command = $2, author = $3, reason = $4
             WHERE id = $5;`,
            [name, command, author, reason, id]
        )

        return res.send({ message: `Successfully edited global command ${id}: ${name}.` })
    } catch (error) {
        debug({ basic: `Database error in putGlobalCommand: ${JSON.stringify(error)}` })
        return res.status(500).send({ error: 'Internal Server Error' })
    }
}

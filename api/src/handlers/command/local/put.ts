import type { FastifyReply, FastifyRequest } from 'fastify'
import run from "#db"
import debug from '#utils/debug.ts'

type PutLocalCommandProps = {
    id: string
    context: string
    name: string
    namespace: string
    command: string
    author: string
    reason: string
}

export default async function putLocalCommand(req: FastifyRequest, res: FastifyReply) {
    const { id, context, name, namespace, command, author, reason } = req.body as PutLocalCommandProps || {}
    if (!id || !context || !name || !namespace || !command || !author || !reason) {
        return res.status(400).send({ error: "Missing id, context, name, namespace, command, author or reason." })
    }

    const exists = await run(`SELECT * FROM local_commands WHERE id = $1`, [id])
    if (!exists.rows.length) {
        return res.status(404).send({ error: `ID ${id} not found.` })
    }

    try {
        debug({ basic: `Adding local command: id=${id} context=${context}, namespace=${name}, command=${command}, author=${author}, reason=${reason}` })

        await run(
            `UPDATE local_commands 
            SET context = $1, name = $2, namespace = $3, command = $4, author = $5, reason = $6
            WHERE id = $7;`,
            [context, name, namespace, command, author, reason, id]
        )

        return res.send({ message: `Successfully added local command ${name} for namespace ${namespace} in context ${context}.` })
    } catch (error) {
        debug({ basic: `Database error in putLocalCommand: ${JSON.stringify(error)}` })
        return res.status(500).send({ error: "Internal Server Error" })
    }
}

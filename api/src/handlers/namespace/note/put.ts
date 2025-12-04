import type { FastifyReply, FastifyRequest } from 'fastify'
import run from "#db"
import debug from '#utils/debug.ts'

type PutNamespaceNoteProps = {
    id: string
    context: string
    namespace: string
    status: string
    message: string
    author: string
}

export default async function putNamespaceNote(req: FastifyRequest, res: FastifyReply) {
    const { id, context, namespace, status, message, author } = req.body as PutNamespaceNoteProps || {}
    if (!id || !context || !namespace || !status || !message || !author) {
        return res.status(400).send({ error: "Missing id, context, namespace, status, message or author" })
    }

    const exists = await run(`SELECT * FROM namespace_notes WHERE id = $1`, [id])
    if (!exists.rows.length) {
        return res.status(404).send({ error: `Note ${id} not found.` })
    }

    try {
        debug({ basic: `Updating note: id=${id} context=${context} namespace=${namespace}, status=${status}, message=${message}, author=${author}` })

        await run(
            `UPDATE namespace_notes
            SET context = $2, namespace = $3, status = $4, message = $5, author = $6
            WHERE id = $1;`,
            [id, context, namespace, status, message, author]
        )

        return res.send({ message: `Successfully updated note with id ${id}.` })
    } catch (error) {
        debug({ basic: `Database error in putNamespaceNote: ${JSON.stringify(error)}` })
        return res.status(500).send({ error: "Internal Server Error" })
    }
}

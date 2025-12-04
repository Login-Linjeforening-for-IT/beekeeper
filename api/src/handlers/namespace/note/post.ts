import type { FastifyReply, FastifyRequest } from 'fastify'
import run from "#db"
import tokenWrapper from "#utils/tokenWrapper.ts"
import debug from '#utils/debug.ts'

type PostNamespaceNoteProps = {
    context: string
    namespace: string
    status: string
    message: string
    author: string
}

export default async function postNamespaceNote(req: FastifyRequest, res: FastifyReply) {
    const { context, namespace, status, message, author } = req.body as PostNamespaceNoteProps || {}
    const { valid } = await tokenWrapper(req, res)
    if (!valid) {
        return res.status(400).send({ error: "Unauthorized" })
    }

    if (!context || !namespace || !status || !message || !author) {
        return res.status(400).send({ error: "Missing context, namespace, status, message or author." })
    }

    try {
        debug({ basic: `Adding namespace note: context=${context} namespace=${namespace}, status=${status}, message=${message} author=${author}` })

        await run(
            `INSERT INTO namespace_notes (context, name, status, message) 
             SELECT $1, $2, $3, $4;`,
            [context, namespace, status, message, author]
        )

        return res.send({ message: `Successfully added namespace note to notes.` })
    } catch (error) {
        debug({ basic: `Database error in postNamespaceNote: ${JSON.stringify(error)}` })
        return res.status(500).send({ error: "Internal Server Error" })
    }
}

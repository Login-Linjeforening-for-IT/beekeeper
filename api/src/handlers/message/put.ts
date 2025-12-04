import type { FastifyReply, FastifyRequest } from 'fastify'
import run from "#db"
import debug from '#utils/debug.ts'

type PutMessageProps = {
    id: string
    title: string
    author: string
    status: string
    content: string
}

export default async function putMessage(req: FastifyRequest, res: FastifyReply) {
    const { id, title, author, status, content } = req.body as PutMessageProps || {}
    if (!id || !title || !author || !status || !content) {
        return res.status(400).send({ error: "Missing id, title, author, status or content" })
    }

    const exists = await run(`SELECT * FROM messages WHERE id = $1`, [id])
    if (!exists.rows.length) {
        return res.status(404).send({ error: `Message ${id} not found.` })
    }

    try {
        debug({ basic: `Updating message: id=${id} status=${status}, content=${content}, author=${author}` })

        await run(
            `UPDATE messages
            SET title = $2, author = $3, status = $4, content = $5
            WHERE id = $1;`,
            [id, title, author, status, content]
        )

        return res.send({ message: `Successfully updated message with id ${id}.` })
    } catch (error) {
        debug({ basic: `Database error in putMessage: ${JSON.stringify(error)}` })
        return res.status(500).send({ error: "Internal Server Error" })
    }
}

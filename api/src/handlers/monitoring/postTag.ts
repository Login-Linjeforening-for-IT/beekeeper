import type { FastifyReply, FastifyRequest } from 'fastify'
import run from '#db'
import tokenWrapper from '#utils/tokenWrapper.ts'
import debug from '#utils/debug.ts'

type PostTagBody = {
    name: string
}

export default async function postTag(req: FastifyRequest, res: FastifyReply) {
    const { name } = req.body as PostTagBody || {}
    const { valid } = await tokenWrapper(req, res)
    if (!valid) {
        return res.status(400).send({ error: 'Unauthorized' })
    }

    try {
        debug({ detailed: `Posting tag: name=${name}` })
        await run(`INSERT INTO status_tags (name) SELECT $1;`, [name])
        return res.send({ message: `Successfully added tag ${name}.` })
    } catch (error) {
        debug({ basic: `Database error in postUpdate: ${JSON.stringify(error)}` })
        return res.status(500).send({ error: 'Internal Server Error' })
    }
}

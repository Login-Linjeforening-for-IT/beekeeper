import type { FastifyReply, FastifyRequest } from 'fastify'
import { runInTransaction } from '#db'

export default async function postSite(req: FastifyRequest, res: FastifyReply) {
    const {
        name,
        ip,
        primary = false,
        operational = false,
        added_by
    } = req.body as any

    try {
        const result = await runInTransaction(async (client) => {
            if (primary) {
                await client.query(`UPDATE sites SET primary = FALSE WHERE primary = TRUE;`)
            }

            const insertResult = await client.query(
                `INSERT INTO sites (name, ip, primary, operational, added_by, updated_by)
                VALUES ($1, $2, $3, $4, $5, $5)
                RETURNING *;`,
                [name, ip, primary, operational, added_by]
            )

            return insertResult.rows[0]
        })

        return res.status(201).send(result)
    } catch (err) {
        throw err
    }
}

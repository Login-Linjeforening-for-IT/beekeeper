import type { FastifyReply, FastifyRequest } from 'fastify'
import { runInTransaction } from '#db'

type PutSiteProps = {
    name: string
    ip: string
    primary: boolean
    operational: boolean
    maintenance: boolean
    note: string
    updatedBy: string
}

export default async function putSite(req: FastifyRequest,res: FastifyReply) {
    const { id } = req.params as { id: string }
    const {
        name,
        ip,
        primary,
        operational,
        updatedBy,
        note,
        maintenance
    } = req.body as PutSiteProps ?? {}

    try {
        const result = await runInTransaction(async (client) => {
            if (primary === true) {
                await client.query('UPDATE sites SET primary = FALSE WHERE primary = TRUE;')
            }

            const updateResult = await client.query(
                `UPDATE sites
                SET name = COALESCE($1, name),
                    ip = COALESCE($2, ip),
                    primary = COALESCE($3, primary),
                    operational = COALESCE($4, operational),
                    updated_by = $5,
                    updated_at = NOW()
                WHERE id = $6
                RETURNING *;`,
                [name, ip, primary, operational, updatedBy, id, note || null, maintenance]
            )

            if (updateResult.rowCount === 0) {
                throw new Error('SITE_NOT_FOUND')
            }

            return updateResult.rows[0]
        })

        return res.send(result)
    } catch (error) {
        if ((error as Error).message === 'SITE_NOT_FOUND') {
            return res.status(404).send({ error: 'Site not found' })
        }

        return res.status(500).send({ error: 'Internal Server Error' })
    }
}

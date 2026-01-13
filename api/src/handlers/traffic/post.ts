import type { FastifyReply, FastifyRequest } from 'fastify'
import run from '#db'
import debug from '#utils/debug.ts'
import config from '#constants'

type PostTrafficBody = {
    user_agent: string
    domain: string
    path: string
    method: string
    referer: string
    timestamp: number
    request_time: number
    status: number
    country_iso?: string
}

export default async function postTraffic(req: FastifyRequest, res: FastifyReply) {
    const allowedIPs = ['127.0.0.1']
    const secret = config.TRAFFIC_SECRET || ''
    const providedSecret = req.headers['x-traffic-secret']
    const realIP = req.headers['x-real-ip']

    if (!allowedIPs.includes(realIP as string) || providedSecret !== secret) {
        return res.status(403).send({ error: 'Forbidden' })
    }

    const { user_agent, domain, path, method, referer, timestamp, request_time, status, country_iso } = req.body as PostTrafficBody || {}

    if (!user_agent || !domain || !path || !method || !referer || request_time === undefined || timestamp === undefined || status === undefined) {
        return res.status(400).send({ error: 'Missing required fields.' })
    }

    try {
        const ts = new Date(timestamp).toISOString()

        await run(
            `INSERT INTO traffic (user_agent, domain, path, method, referer, request_time, status, timestamp, country_iso)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);`,
            [user_agent, domain, path, method, referer, request_time, status, ts, country_iso || null]
        )

        return res.send({ message: 'Traffic logged successfully.' })
    } catch (error) {
        debug({ basic: `Database error in postTraffic: ${JSON.stringify(error)}` })
        return res.status(500).send({ error: 'Internal Server Error' })
    }
}
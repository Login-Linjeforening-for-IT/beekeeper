import { FastifyReply, FastifyRequest } from 'fastify'
import run from '#db'
import debug from '#utils/debug.ts'
import config from '#constants'

type PostTrafficBody = {
    ip: string
    user_agent: string
    domain: string
    path: string
    method: string
    referer: string
    request_time: number
    status: number
    timestamp: number
}

export default async function postTraffic(req: FastifyRequest, res: FastifyReply) {
    const allowedIPs = ['127.0.0.1', '::1']
    const clientIP = req.ip || ''
    const secret = config.TRAFFIC_SECRET || ''
    const providedSecret = req.headers['x-traffic-secret']

    if (!allowedIPs.includes(clientIP) || providedSecret !== secret) {
        return res.status(403).send({ error: 'Forbidden' })
    }

    const { user_agent, domain, path, method, referer, timestamp, request_time, status } = req.body as PostTrafficBody || {}

    if (!user_agent || !domain || !path || !method || !referer || request_time === undefined || timestamp === undefined || status === undefined) {
        return res.status(400).send({ error: 'Missing required fields.' })
    }

    try {
        const ts = new Date(timestamp * 1000).toISOString()

        await run(
            `INSERT INTO traffic (user_agent, domain, path, method, referer, request_time, status, timestamp)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8);`,
            [user_agent, domain, path, method, referer, request_time, status, ts]
        )

        return res.send({ message: 'Traffic logged successfully.' })
    } catch (error) {
        debug({ basic: `Database error in postTraffic: ${JSON.stringify(error)}` })
        return res.status(500).send({ error: 'Internal Server Error' })
    }
}
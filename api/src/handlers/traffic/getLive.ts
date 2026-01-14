import type { FastifyReply, FastifyRequest } from 'fastify'
import trafficEmitter from '#utils/trafficEmitter.ts'
import { on } from 'events'

export default async function getLive(_req: FastifyRequest, res: FastifyReply) {
    res.sse.keepAlive()
    await res.sse.send({ data: 'connected' })

    const ac = new AbortController()
    const countMap = new Map<string, number>()
    const batchInterval = 5000
    let minTimestamp = Infinity

    function flushBatch() {
        if (countMap.size > 0) {
            const aggregated = Array.from(countMap.entries()).map(([iso, count]) => ({ iso, count, timestamp: new Date(minTimestamp).toISOString() }))
            countMap.clear()
            res.sse.send({ event: 'traffic', data: aggregated }).catch(() => {})
            minTimestamp = Infinity
        }
    }

    const flushTimer = setInterval(flushBatch, batchInterval)

    function cleanup() {
        clearInterval(flushTimer)
        ac.abort()
    }

    res.sse.onClose(cleanup)

    try {
        for await (const [data] of on(trafficEmitter, 'traffic', { signal: ac.signal })) {
            const { country_iso, timestamp } = data as { country_iso?: string, timestamp: number }
            minTimestamp = Math.min(minTimestamp, timestamp)
            const iso = country_iso || 'unknown'
            countMap.set(iso, (countMap.get(iso) || 0) + 1)
        }
    } catch (err: unknown) {
        if (err && (err as Error).name !== 'AbortError') {
            throw err
        }
    } finally {
        cleanup()
    }
}

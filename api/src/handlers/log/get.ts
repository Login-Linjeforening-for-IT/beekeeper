import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify"
import run from "#db"
import { loadSQL } from "#utils/loadSQL.ts"
import config from '#constants'
import getContext from '#utils/getContext.ts'
import debug from '#utils/debug.ts'

const { DEFAULT_RESULTS_PER_PAGE } = config

type LogProps = {
    resultsPerPage?: string
    page?: string
    context?: string
    namespace?: string
    search?: string
}

export default async function getLog(this: FastifyInstance, req: FastifyRequest, res: FastifyReply) {
    const { log } = req.params as { log: string } || {}
    const {
        resultsPerPage: clientResultsPerPage,
        page,
        context,
        namespace,
        search
    } = req.query as LogProps || {}
    const resultsPerPage = Number(clientResultsPerPage) || DEFAULT_RESULTS_PER_PAGE
    const Page = page && Number(page) > 0 ? Number(page) : 1

    if (log !== 'local' && log !== 'global' || (log === 'local' && (!namespace || !context))) {
        const missingVars = !namespace || !context
        const simple = "Missing context or namespace. This is a local log. Context and namespace is expected."
        const advanced = "Invalid log parameter (log !== 'local' && log !== 'global' || (log === 'local' && (!namespace || !context)))"
        const error = missingVars ? simple : advanced
        return res.send({
            page,
            resultsPerPage,
            results: [],
            error
        })
    }

    try {
        let shouldBeCached = false
        const formattedContext = await getContext(context ?? 'prod')
        const isLocal = log === 'local'
        const logQueryFile = isLocal
            ? search
                ? 'fetchLocalLog.sql'
                : 'fetchLocalLogNoSearch.sql'
            : 'fetchGlobalLog.sql'
        const logCountQueryFile = isLocal
            ? search
                ? 'fetchLocalLogCount.sql'
                : 'fetchLocalLogCountNoSearch.sql'
            : 'fetchGlobalLogCount.sql'
        const logQueryParameters = isLocal
            ? search
                ? [Page, resultsPerPage, namespace, search || null, formattedContext]
                : [Page, resultsPerPage, namespace, formattedContext]
            : [Page, resultsPerPage, search || null]
        const logCountQueryParameters = isLocal
            ? search
                ? [namespace, search || null, formattedContext]
                : [namespace, formattedContext]
            : [search || null]
        const indexedPage = Page - 1
        const pageIsCached = resultsPerPage === 50
            ? indexedPage < 10
            : resultsPerPage === 100
                ? indexedPage < 5
                : indexedPage < 20

        const logQuery = (await loadSQL(logQueryFile))
        const logCountQuery = (await loadSQL(logCountQueryFile))
        const result = await run(logQuery, logQueryParameters)
        const count = await run(logCountQuery, logCountQueryParameters)
        const pages = Math.ceil((Number(count.rows[0].count) || 1) / resultsPerPage)
        if (Page > pages) {
            debug({ detailed: `Page does not exist (${Page} / ${pages})` })
            const data = {
                namespace: namespace || 'global',
                context: context || 'global',
                page: Page,
                pages,
                resultsPerPage,
                error: `Page does not exist (${Page} / ${pages})`,
                results: []
            }

            return res.send(data)
        }

        const data = {
            page: Page,
            pages,
            resultsPerPage,
            results: result.rows
        }

        return res.send(data)
    } catch (error) {
        debug({ basic: `Database error in getLog: ${JSON.stringify(error)}` })
        return res.status(500).send({ error: "Internal Server Error" })
    }
}

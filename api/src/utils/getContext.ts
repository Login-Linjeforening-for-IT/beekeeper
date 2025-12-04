import config from '#constants'
import run from '#db'

export default async function getContext(query: string) {
    const context = await run('SELECT name FROM contexts WHERE name ILIKE $1', [query])
    return context.rows[0] ?? config.DEFAULT_CLUSTER
}

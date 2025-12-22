import pg from 'pg'
import config from '#constants'
import sleep from '#utils/sleep.ts'
import debug from '#utils/debug.ts'

const {
    DB,
    DB_USER,
    DB_HOST,
    DB_PASSWORD,
    DB_PORT,
    DB_MAX_CONN,
    DB_IDLE_TIMEOUT_MS,
    DB_TIMEOUT_MS
} = config
const { Pool } = pg
const pool = new Pool({
    user: DB_USER || 'beekeeper',
    host: DB_HOST || 'beekeeper_database',
    database: DB || 'beekeeper',
    password: DB_PASSWORD,
    port: Number(DB_PORT) || 5432,
    max: Number(DB_MAX_CONN) || 20,
    idleTimeoutMillis: Number(DB_IDLE_TIMEOUT_MS) || 5000,
    connectionTimeoutMillis: Number(DB_TIMEOUT_MS) || 3000
})

export default async function run(query: string, params?: (string | number | null | boolean)[]) {
    while (true) {
        try {
            const client = await pool.connect()
            try {
                return await client.query(query, params ?? [])
            } finally {
                client.release()
            }
        } catch (error) {
            console.log(error)
            debug({ basic: `Pool currently unavailable, retrying in ${config.TIMEOUT_MS / 1000}s...` })
            await sleep(config.TIMEOUT_MS)
        }
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function runInTransaction(callback: (client: pg.PoolClient) => Promise<any>) {
    const client = await pool.connect()

    try {
        await client.query('BEGIN')
        const result = await callback(client)
        await client.query('COMMIT')
        return result
    } catch (error) {
        await client.query('ROLLBACK')
        throw error
    } finally {
        client.release()
    }
}

import run from '#db'

export default async function getMonitored(): Promise<number> {
    const result = await run('SELECT * FROM status')
    return result.rowCount || 0
}

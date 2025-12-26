import run from '#db'

export default async function getSites(): Promise<number> {
    const sitesResult = await run('SELECT * FROM sites')
    return sitesResult.rowCount || 0
}

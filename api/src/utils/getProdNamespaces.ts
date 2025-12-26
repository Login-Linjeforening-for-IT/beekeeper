import run from '#db'

export default async function getProdNamespaces(): Promise<number> {
    const result = await run('SELECT * FROM namespaces WHERE POSITION(\'prod\' IN context) > 0 ORDER BY name')
    return result.rowCount || 0
}

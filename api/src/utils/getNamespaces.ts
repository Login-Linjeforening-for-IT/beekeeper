import run from '#db'

export default async function getNamespaces() {
    const result = await run('SELECT * FROM namespaces ORDER BY name;')
    return result.rows
}

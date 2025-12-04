import run from '#db'

export default async function getNamespaces() {
    const result = await run(`SELECT name FROM namespaces ORDER BY name;`)
    return result.rows.map((row) => row.name)
}

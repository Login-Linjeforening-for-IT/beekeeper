import run from '#db'

export default async function getContexts() {
    const result = await run('SELECT name FROM contexts ORDER BY name;')
    return result.rows.map((row) => row.name)
}

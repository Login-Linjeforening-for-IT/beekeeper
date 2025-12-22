import run from '#db'

export async function getDomains(context: string, service: string): Promise<Domain[]> {
    const result = await run(
        'SELECT * FROM namespace_domains WHERE context = $1 AND namespace = $2 ORDER BY name;',
        [context, service]
    )

    return result.rows
}

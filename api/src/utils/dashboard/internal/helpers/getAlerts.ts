import config from '#constants'

export default async function getAlerts(): Promise<number> {
    try {
        const response = await fetch(`${config.workerbee}/alerts`)
        if (!response.ok) {
            throw new Error(await response.text())
        }

        const data = await response.json()
        if (!('total_count' in data)) {
            throw new Error(`Missing total count: ${await response.text()}`)
        }

        return data.total_count
    } catch (error) {
        console.log(error)
        return 0
    }
}

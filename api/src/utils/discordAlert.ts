import config from '#constants'
import debug from './debug.ts'

const { CRITICAL_ROLE, WEBHOOK_URL } = config

export default async function discordAlert(description: string) {
    try {
        let data: { content?: string; embeds: any[] } = {
            embeds: [
                {
                    title: '🐝 BeeKeeper BTG Login 🐝',
                    description: description,
                    color: 0xff0000,
                    timestamp: new Date().toISOString()
                }
            ]
        }

        if (CRITICAL_ROLE) {
            data.content = `🚨 <@&${CRITICAL_ROLE}> 🚨`
        }

        const response = await fetch(WEBHOOK_URL ?? '', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })

        if (!response.ok) {
            throw new Error(await response.text())
        }

        return response.status
    } catch (error) {
        debug({ basic: error })
    }
}

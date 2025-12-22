import debug from '#utils/debug.ts'
import smallDate from './smallDate.ts'

export default async function notify(service: CheckedServiceStatus) {
    try {
        let data: { content?: string; embeds: any[] } = {
            embeds: [
                {
                    title: `🐝 ${service.name} ${service.status ? 'is up.' : 'went down!'}`,
                    description: `**Service Name**\n${service.name}\n\n**Service URL**\n${service.url}\n\n**Service Type**\n${service.type}`,
                    color: service.status ? 0x48a860 : 0xff0000,
                    timestamp: new Date().toISOString(),
                    footer: {
                        text: `Ping ${service.delay}ms`
                    }
                }
            ]
        }

        if (service.notification_message) {
            data.content = service.notification_message
        }

        const response = await fetch(service.notification_webhook ?? '', {
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

import debug from '#utils/debug.ts'

export default async function notify(service: CheckedServiceStatus) {
    const delay = Array.isArray(service.bars) && service.bars.length ? service.bars[0].delay : 0
    try {
        const data: { content?: string; embeds: object[] } = {
            embeds: [
                {
                    title: `🐝 ${service.name} ${service.bars[0].status ? 'is up.' : 'went down!'}`,
                    description: `**Service Name**\n${service.name}\n\n${service.url.length ? `**Service URL**\n${service.url}\n\n` : ''}**Service Type**\n${service.type}`,
                    color: service.bars[0].status ? 0x48a860 : 0xff0000,
                    timestamp: new Date().toISOString(),
                    footer: {
                        text: `Ping ${delay}ms`
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
        debug({ basic: (error as Error) })
    }
}

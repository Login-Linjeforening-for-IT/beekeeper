import getNamespaces from '#utils/getNamespaces.ts'
import { contexts, fallback, priority } from './defaults.ts'
import worstAndBestServiceStatus from './worstAndBestServiceStatus.ts'

export default async function preloadStatus(): Promise<Status> {
    try {
        const namespaces = await getNamespaces()
        const prod: Service[] = []
        const dev: Service[] = []

        for (const namespace of namespaces) {
            if (namespace.context.includes(contexts.prod)) {
                prod.push(namespace)
            } else {
                dev.push(namespace)
            }
        }

        const { meta: metaProd, status: statusProd } = await worstAndBestServiceStatus({
            context: contexts.prod,
            services: prod,
        })

        const { meta: metaDev, status: statusDev } = await worstAndBestServiceStatus({
            context: contexts.dev,
            services: dev,
        })

        return {
            prod: {
                status: {
                    number: priority[metaProd],
                    message: metaProd
                },
                services: statusProd,
                meta: metaProd
            },
            dev: {
                status: {
                    number: priority[metaDev],
                    message: metaDev
                },
                services: statusDev,
                meta: metaDev
            }
        } as StatusOperational
    } catch (error) {
        console.error('Error while fetching status')
        console.log(error)
        return fallback.degraded as StatusDegraded
    }
}

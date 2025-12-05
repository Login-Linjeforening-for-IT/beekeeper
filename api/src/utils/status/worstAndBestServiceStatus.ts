import { priority } from './defaults.ts'
import serviceStatus from './serviceStatus.ts'

export const ServiceStatus = {
   OPERATIONAL: 'operational',
   DEGRADED: 'degraded',
   DOWN: 'down',
   INACTIVE: 'inactive',
} as const

export type ServiceStatus = typeof ServiceStatus[keyof typeof ServiceStatus]

type WorstAndBestServiceStatus = {
   best: ServiceStatus
   worst: ServiceStatus
   meta: ServiceStatus
   status: { name: string, status: string }[]
}

type MetaServiceStatusProps = {
   context: string
   skipDomains?: boolean
   services: Service[]
}

export default async function worstAndBestServiceStatus({
   context,
   services,
}: MetaServiceStatusProps): Promise<WorstAndBestServiceStatus> {
   const best: ServiceStatus = ServiceStatus.OPERATIONAL
   let worst: ServiceStatus = ServiceStatus.OPERATIONAL
   let upCount = 0
   let downCount = 0

   const statusMap: Map<string, ServiceStatus> = new Map()
   const statusIssueMap: Map<string, string[]> = new Map()

   for (const service of services) {
      statusIssueMap.set(service.name, [])
      const status = await serviceStatus({ context, service, statusIssueMap })
      statusMap.set(service.name, status || services.find((s) => s.name === service.name)?.status || ServiceStatus.DOWN)

      if (service.service_status !== ServiceStatus.OPERATIONAL) {
         statusIssueMap.get(service.name)!.push('server')
      }

      if (priority[status] > priority[worst]) {
         worst = status
      }

      if (status === ServiceStatus.DOWN || status === ServiceStatus.DEGRADED) {
         downCount++
      } else {
         upCount++
      }
   }

   const allDown = downCount === services.length
   const someDown = upCount !== services.length
   let meta: ServiceStatus = ServiceStatus.OPERATIONAL

   if (someDown) {
      meta = ServiceStatus.DEGRADED
   }

   if (allDown) {
      meta = ServiceStatus.DOWN
   }

   return {
      best,
      worst,
      meta,
      status: Array.from(statusMap, ([name, status]) => {
         const issues = statusIssueMap.get(name)
         return {
            name,
            status,
            ...(Array.isArray(issues) && issues.length ? { issues } : {})
         }
      })
   }
}

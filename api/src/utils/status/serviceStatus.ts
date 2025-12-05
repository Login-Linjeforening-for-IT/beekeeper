import getContexts from '#utils/getContexts.ts'
import { contexts as defaultContexts, priority } from './defaults.ts'
import { getDomains } from './getDomains.ts'
import getDomainStatus from './getDomainStatus.ts'
import getLogs from './getLogs.ts'
import podStatus from './podStatus.ts'
import { ServiceStatus } from './worstAndBestServiceStatus.ts'

type ServiceStatusProps = {
    context: string
    service: ServiceAsList
    statusIssueMap: Map<string, string[]>
}

export default async function serviceStatus({
    context,
    service,
    statusIssueMap
}: ServiceStatusProps) {
    const response = await getLogs({
        path: 'local',
        page: 1,
        context: context,
        namespace: service.name
    })

    const relevantLogs = response.results || []
    const uniqueLogsByCommand = new Map()
    relevantLogs.toReversed().forEach((log) => {
        uniqueLogsByCommand.set(log.command, log)
    })

    let worstStatus: ServiceStatusHuman = ServiceStatus.OPERATIONAL
    let worstPriority = priority[worstStatus]

    uniqueLogsByCommand.forEach((log: LocalLog) => {
        const logPriority = priority[log.status] || 1
        if (logPriority > worstPriority) {
            worstStatus = log.status
            worstPriority = logPriority
        }
    })

    if (worstStatus !== ServiceStatus.OPERATIONAL) {
        statusIssueMap.get(service.name)!.push('logs')
    }

    const contexts = await getContexts()
    const ctx = contexts.find((ctx) => ctx.includes(context)) || defaultContexts.prod
    const domains = await getDomains(ctx, service.name)
    const domainsWithStatus: DomainsWithStatus[] = await Promise.all(domains.map(getDomainStatus))
    let down = 0
    let domainDown = false

    domainsWithStatus.forEach((domain) => {
        if (domain.status < 200 || domain.status >= 300) {
            const logPriority = priority.down
            domainDown = true
            down++

            if (logPriority > worstPriority) {
                worstStatus = ServiceStatus.DEGRADED
                worstPriority = logPriority
            }
        }
    })

    if (domainDown) {
        statusIssueMap.get(service.name)!.push('domains')
    }

    if (down === domainsWithStatus.length && domainsWithStatus.length > 0) {
        worstStatus = ServiceStatus.DOWN
    }

    const downplayedStatus = service.service_status === ServiceStatus.OPERATIONAL
        ? worstStatus !== ServiceStatus.OPERATIONAL
            ? worstStatus : ServiceStatus.OPERATIONAL
        : service.service_status

    const { status } = await podStatus(service.name)
    if (status !== ServiceStatus.OPERATIONAL) {
        statusIssueMap.get(service.name)!.push('pods')
    }

    const serviceStatusIncludingPodStatus = downplayedStatus === ServiceStatus.OPERATIONAL
        ? status === ServiceStatus.OPERATIONAL
            ? ServiceStatus.OPERATIONAL
            : status
        : downplayedStatus === ServiceStatus.DEGRADED && (status === ServiceStatus.DEGRADED || status === ServiceStatus.OPERATIONAL)
            ? ServiceStatus.DEGRADED
            : ServiceStatus.DOWN

    return serviceStatusIncludingPodStatus
}

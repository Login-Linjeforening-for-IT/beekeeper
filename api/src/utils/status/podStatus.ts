import run from '#db'
import { ServiceStatus } from './worstAndBestServiceStatus.ts'

type Pod = {
    name: string
    ready: string
    status: string
    restarts: string
    age: string
    context: string
    namespace: string
    timestamp: string
}

type PodGroup = {
    [label: string]: Pod[]
}

export default async function podStatus(namespace: string, context: 'prod' | 'dev' = 'prod') {
    const podsResult = await run(`SELECT * FROM pods ORDER BY name ASC`)
    const allPods = podsResult.rows
    const pods = namespace !== 'global' ? allPods.filter((pod) => pod.context.includes(context) && pod.namespace === namespace) : []
    const labels = new Set()

    for (const pod of pods) {
        const parts = pod.name.split('-')
        if (parts.length) {
            labels.add(formattedPodName(pod.name, pod.namespace))
        }
    }

    const groups = groupPodsByLabel(pods, Array.from(labels) as string[])
    const status = worstPodStatus(groups)
    return { pods, groups, status }
}

function formattedPodName(name: string, namespace: string): string {
    if (!name.includes('-')) {
        return name
    }

    const initialParts = name.split('-')
    const parts = initialParts.slice(0, initialParts.length - 1)

    const valid = []

    for (const part of parts) {
        if (part !== namespace && isNaN(parseInt(part[0], 10))) {
            valid.push(`${part[0].toUpperCase()}${part.slice(1)}`)
        }
    }

    if (!valid.length) {
        return name
    }

    return valid.join(' ')
}

function groupPodsByLabel(pods: Pod[], labels: string[]): PodGroup {
    const grouped: PodGroup = {}

    for (const label of labels) {
        grouped[label] = pods.filter(pod => pod.name.includes(label.replaceAll(' ', '-').toLowerCase()))
    }

    return grouped
}

function worstPodStatus(groupedPods: PodGroup): ServiceStatus {
    let status: ServiceStatus = ServiceStatus.OPERATIONAL
    Object.values(groupedPods).forEach((group) => {
        for (const pod of group) {
            const podStatus = pod.status === 'Running' && !pod.ready.includes('0/')
                ? ServiceStatus.OPERATIONAL
                : pod.restarts !== '0'
                    ? ServiceStatus.DOWN
                    : ServiceStatus.DEGRADED

            if (status === ServiceStatus.OPERATIONAL && (podStatus === ServiceStatus.DEGRADED || podStatus === ServiceStatus.DOWN)) {
                status = podStatus
            } else if (status === ServiceStatus.DEGRADED && podStatus === ServiceStatus.DOWN) {
                status = ServiceStatus.DOWN
            }
        }
    })

    return status
}

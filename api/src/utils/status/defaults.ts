import { ServiceStatus } from './worstAndBestServiceStatus.ts'

const contexts = {
    prod: 'prod',
    dev: 'dev'
}

const priority: Record<ServiceStatus, number> = {
    [ServiceStatus.DOWN]: 3,
    [ServiceStatus.DEGRADED]: 2,
    [ServiceStatus.INACTIVE]: 1,
    [ServiceStatus.OPERATIONAL]: 0,
}

const fallbackStatusDegraded = {
    status: {
        number: 2,
        message: 'degraded',
        error: 'API or Database Error'
    },
    services: [],
    meta: 'degraded'
}

const fallbackStatusStarting = {
    status: {
        number: 0,
        message: 'operational',
        info: 'starting'
    },
    services: [],
    meta: 'operational'
}

const degraded = {
    prod: { ...fallbackStatusDegraded },
    dev: { ...fallbackStatusDegraded }
} as StatusDegraded

const starting = {
    prod: fallbackStatusStarting,
    dev: fallbackStatusStarting
} as StatusStarting


const fallback = { degraded, starting }

export { contexts, fallback, priority }

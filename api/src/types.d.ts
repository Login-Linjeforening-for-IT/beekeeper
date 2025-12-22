type Service = {
    context: string
    name: string
    status: string
    service_status: ServiceStatusHuman
    age: string
}

type LocalLog = {
    context: string
    namespace: string
    id: string
    name: string
    event: string
    status: ServiceStatusHuman
    command: string
    timestamp: string
}

type DomainsWithStatus = {
    id: string
    name: string
    url: string
    context: string
    namespace: string
    status: number
}

type ServiceAsList = {
    context: string
    name: string
    status: string
    service_status: ServiceStatusHuman
    age: string
}

type ServiceStatusHuman = 'operational' | 'degraded' | 'down' | 'inactive'

type Domain = {
    id: string
    name: string
    url: string
    context: string
    namespace: string
}

type StatusCache = {
    age: number
    data: {
        prod: {
            status: {
                number: number
                message: string
            },
            services: Service[]
            meta: string
        },
        dev: {
            status: {
                number: number
                message: string
            },
            services: Service[]
            meta: string
        }
    } | null
    refresh: number
}

type StatusStarting = {
    prod: {
        status: {
            number: number
            message: string
            info: string
        },
        services: { name: string, status: ServiceStatusHuman }[]
        meta: ServiceStatusHuman
    }
    dev: {
        status: {
            number: number
            message: string
            info: string
        }
        services: { name: string, status: ServiceStatusHuman }[]
        meta: ServiceStatusHuman
    }
}

type StatusDegraded = {
    prod: {
        status: {
            number: number
            message: string
            error: string
        },
        services: never[]
        meta: ServiceStatusHuman
    }
    dev: {
        status: {
            number: number
            message: string
            error: string
        }
        services: never[]
        meta: ServiceStatusHuman
    }
}

type StatusOperational = {
    prod: {
        status: {
            number: number
            message: ServiceStatusHuman
        },
        services: { name: string, status: ServiceStatusHuman }[]
        meta: ServiceStatusHuman
    }
    dev: {
        status: {
            number: number
            message: ServiceStatusHuman
        },
        services: { name: string, status: ServiceStatusHuman }[]
        meta: string
    }
}

type Status = StatusOperational | StatusStarting | StatusDegraded

type CheckedServiceStatus = {
    id: number
    name: string
    type: string
    url: string
    notification: number
    interval: number
    expected_down: boolean
    max_consecutive_failures: number
    note: string
    notified: null | boolean
    tags: Tag[]
    enabled: boolean
    service_id: number
    delay: number
    timestamp: string
    notification_id: null | number
    notification_name: null | string
    notification_message: null | string
    notification_webhook: null | string
    bars: Bar[]
}

type ServiceNotification = {
    name: string
    message: string
    webhook: string
}

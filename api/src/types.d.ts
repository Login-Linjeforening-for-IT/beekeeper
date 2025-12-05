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
   dev:{
      status:{
         number: number
         message: string
         info: string
      }
      services: { name: string, status: ServiceStatusHuman }[]
      meta: ServiceStatusHuman
   }
}

type StatusDegraded = {
   prod:{
      status: {
         number: number
         message: string
         error: string
      },
      services: never[]
      meta: ServiceStatusHuman
   }
   dev:{
      status:{
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
      status:{
         number: number
         message: ServiceStatusHuman
      },
      services: { name: string, status: ServiceStatusHuman }[]
      meta: ServiceStatusHuman
   }
   dev:{
      status: {
         number: number
         message: ServiceStatusHuman
      },
      services: { name: string, status: ServiceStatusHuman }[]
      meta: string
   }
}

type Status = StatusOperational | StatusStarting | StatusDegraded

import checkMaxConnectionsCron from './maxConnections.ts'
import heartbeat from './heartbeat.ts'

export default function cron() {
    checkMaxConnectionsCron()
    setInterval(async() => {
        heartbeat()
    }, 60000)
}

import checkMaxConnectionsCron from './maxConnections.js'
import heartbeat from './heartbeat.js'

export default function cron() {
    checkMaxConnectionsCron()
    setInterval(async() => {
        heartbeat()
    }, 60000)
}

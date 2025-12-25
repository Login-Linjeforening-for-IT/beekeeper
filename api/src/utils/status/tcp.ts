import net from 'net'

export default async function checkTcpService(service: DetailedService & { bars: Bar[]; }): Promise<{ status: boolean, delay: number }> {
    const start = Date.now()

    return new Promise((resolve) => {
        const socket = new net.Socket()
        let finished = false

        const timeout = setTimeout(() => {
            if (!finished) {
                finished = true
                socket.destroy()
                resolve({ status: false, delay: Date.now() - start })
            }
        }, 10000)

        if (service.port) {
            socket.connect(service.port, service.url, () => {
                if (!finished) {
                    finished = true
                    clearTimeout(timeout)
                    socket.end()
                    resolve({ status: true, delay: Date.now() - start })
                }
            })

            socket.on('error', () => {
                if (!finished) {
                    finished = true
                    clearTimeout(timeout)
                    resolve({ status: false, delay: Date.now() - start })
                }
            })
        } else {
            resolve({ status: false, delay: Date.now() - start })
        }
    })
}

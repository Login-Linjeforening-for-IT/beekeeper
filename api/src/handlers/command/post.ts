import type { FastifyReply, FastifyRequest } from 'fastify'
import { exec } from 'child_process'
import run from '#db'
import path from 'path'
import tokenWrapper from '#utils/tokenWrapper.ts'
import debug from '#utils/debug.ts'

type PostCommandBody = {
    id: string
    type: string
}

export default async function runCommand(req: FastifyRequest, res: FastifyReply) {
    const { type, id } = req.body as PostCommandBody || {}
    const { valid } = await tokenWrapper(req, res)
    if (!valid) {
        return res.status(400).send({ error: 'Unauthorized' })
    }

    let command = `echo 'Command not found'`
    if (!type || !id) {
        return res.status(400).send({ error: 'Missing id or type.' })
    }

    if (type === 'local') {
        const local = await run(`SELECT * FROM local_commands WHERE id = $1`, [id])
        if (!local.rowCount) {
            return res.status(400).send({ error: 'Invalid command.' })
        } else {
            command = local.rows[0].command
        }
    } else {
        const global = await run(`SELECT * FROM global_commands WHERE id = $1`, [id])
        if (!global.rowCount) {
            return res.status(400).send({ error: 'Invalid command.' })
        } else {
            command = global.rows[0].command
        }
    }

    try {
        debug({ detailed: `Running command ${id}: ${command}` })

        const scriptPath = path.resolve('../../../run_now.sh')
        const fullCommand = `${scriptPath} '${command}'`

        exec(fullCommand, (error, stdout, stderr) => {
            if (error) {
                debug({ basic: `Execution error: ${error.message}` })
                return res.status(500).send({ error: 'Failed to execute command.' })
            }

            if (stderr) {
                console.warn(`Command stderr: ${stderr}`)
            }

            debug({ detailed: `Command output: ${stdout}` })
            return res.send({ message: `Successfully ran command ${id}.`, output: stdout })
        })

        return res.send({ message: `Successfully ran command ${id}: ${command}.` })
    } catch (error) {
        debug({ basic: `Database error in runCommand: ${JSON.stringify(error)}` })
        return res.status(500).send({ error: 'Internal Server Error' })
    }
}

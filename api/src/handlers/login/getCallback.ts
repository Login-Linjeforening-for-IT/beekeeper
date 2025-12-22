import type { FastifyReply, FastifyRequest } from 'fastify'
import config from '#constants'
import debug from '#utils/debug.ts'

const { TOKEN_URL, CLIENT_ID, CLIENT_SECRET, REDIRECT_URI, USERINFO_URL, BEEKEEPER_URL } = config

type UserInfo = {
    sub: string
    name: string
    email: string
    groups: string[]
}

/**
 * Callback route to exchange code for token
 * @param req Request
 * @param res Response
 */
export default async function getCallback(req: FastifyRequest, res: FastifyReply): Promise<object> {
    const { code } = req.query as { code: string }

    if (!code) {
        return res.status(400).send('No authorization code found.')
    }

    try {
        // Exchanges callback code for access token
        const tokenResponse = await fetch(TOKEN_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: CLIENT_ID as string,
                client_secret: CLIENT_SECRET as string,
                code: code as string,
                redirect_uri: REDIRECT_URI as string,
                grant_type: 'authorization_code',
            }).toString()
        })

        const tokenResponseBody = await tokenResponse.text()

        if (!tokenResponse.ok) {
            return res.status(500).send(`Failed to obtain token: ${tokenResponseBody}`)
        }

        const token = JSON.parse(tokenResponseBody)

        // Fetches user info using access token
        const userInfoResponse = await fetch(USERINFO_URL, {
            headers: { Authorization: `Bearer ${token.access_token}` }
        })

        if (!userInfoResponse.ok) {
            const userInfoError = await userInfoResponse.text()
            return res.status(500).send(`No user info found: ${userInfoError}`)
        }

        const userInfo = await userInfoResponse.json() as UserInfo

        const redirectUrl = new URL(`${BEEKEEPER_URL}/login`)
        const params = new URLSearchParams({
            id: userInfo.sub,
            name: userInfo.name,
            email: userInfo.email,
            groups: userInfo.groups.join(','),
            access_token: token.access_token
        })

        redirectUrl.search = params.toString()
        return res.redirect(redirectUrl.toString())
    } catch (err: unknown) {
        const error = err as Error
        debug({ basic: `Error during OAuth2 flow: ${error.message}` })
        return res.status(500).send('Authentication failed')
    }
}

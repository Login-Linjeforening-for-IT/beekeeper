import type { FastifyReply, FastifyRequest } from 'fastify'
import config from '#constants'

const { CLIENT_ID, REDIRECT_URI, AUTH_URL } = config

// Redirects to Authentik for login
export default function getLogin(_: FastifyRequest, res: FastifyReply) {
    const state = Math.random().toString(36).substring(5)
    const authQueryParams = new URLSearchParams({
        client_id: CLIENT_ID as string,
        redirect_uri: REDIRECT_URI as string,
        response_type: 'code',
        scope: 'openid profile email',
        state: state,
    }).toString()

    res.redirect(`${AUTH_URL}?${authQueryParams}`)
}

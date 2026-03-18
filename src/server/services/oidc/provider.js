import Provider from 'oidc-provider'
import { RedisAdapter } from './redis-adapter.js'
import { createLogger } from '../../common/helpers/logging/logger.js'
import { SIGNOUT_REDIRECT_COOKIE_NAME } from '../../oidc/constants.js'

const logger = createLogger()

const CUSTOM_USERINFO_CLAIM = [
  'email',
  'given_name',
  'family_name',
  'display_name',
  'primary_cph',
  'delegated_cph'
]

export function resolveClientGrantTypes(client = {}) {
  if (Array.isArray(client.grant_types) && client.grant_types.length > 0) {
    return client.grant_types
  }

  return ['authorization_code', 'refresh_token']
}

export function buildBrokerConfiguration({
  cookiePassword,
  sessionCookieSecure,
  redis,
  userService
}) {
  function decodeSignoutRedirect(value) {
    if (typeof value !== 'string' || !value.trim()) {
      return '/'
    }

    try {
      return decodeURIComponent(value)
    } catch {
      return '/'
    }
  }

  return {
    adapter: (model) => new RedisAdapter(model, redis, 'oidc'),

    features: {
      devInteractions: { enabled: false },
      rpInitiatedLogout: {
        enabled: true,
        async logoutSource(ctx, form) {
          ctx.type = 'html'
          ctx.status = 200
          ctx.body = `<!DOCTYPE html>
            <html lang="en">
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <title>Signing out</title>
              </head>
              <body>
                ${form}
                <script>
                  document.getElementById('op.logoutForm')?.submit()
                </script>
              </body>
            </html>`
        },
        async postLogoutSuccessSource(ctx) {
          const redirectTarget = decodeSignoutRedirect(
            ctx.cookies.get(SIGNOUT_REDIRECT_COOKIE_NAME)
          )

          ctx.cookies.set(SIGNOUT_REDIRECT_COOKIE_NAME, null, {
            path: '/',
            secure: sessionCookieSecure,
            httpOnly: true,
            sameSite: 'lax'
          })

          ctx.status = 303
          ctx.redirect(redirectTarget)
        }
      }
    },

    responseTypes: ['code'],
    scopes: ['openid', 'offline_access', 'profile', 'email'],

    ttl: {
      AccessToken: 15 * 60,
      AuthorizationCode: 2 * 60,
      IdToken: 15 * 60,
      Session: 8 * 60 * 60
    },

    cookies: {
      keys: [cookiePassword],
      short: { path: '/', signed: true },
      long: { path: '/', signed: true }
    },

    claims: {
      openid: ['sub', ...CUSTOM_USERINFO_CLAIM],
      profile: ['first_name', 'family_name', 'display_name'],
      email: ['email']
    },

    interactions: {
      url(ctx, interaction) {
        return `/interaction/${interaction.uid}`
      }
    },

    routes: {
      authorization: '/authorize',
      end_session: '/oidc/signout',
      userinfo: '/userinfo'
    },

    async findAccount(ctx, sub) {
      return {
        accountId: sub,
        async claims(use) {
          console.log('claims', use)
          return await userService.getUserContext(ctx.request, sub)
        }
      }
    }
  }
}

export function buildBrokerProvider({
  cookiePassword,
  sessionCookieSecure,
  issuer,
  redis,
  clientsService,
  userService
}) {
  const configuration = buildBrokerConfiguration({
    cookiePassword,
    sessionCookieSecure,
    redis,
    userService
  })

  const oidc = new Provider(issuer, configuration)

  oidc.on('server_error', (ctx, err) => {
    logger.error(`[oidc-provider] server_error: ${err?.message}`)
    if (err?.stack) {
      logger.error(err.stack)
    }
    logger.error(
      `[oidc-provider] context: ${{
        route: ctx?.request?.url,
        method: ctx?.request?.method,
        clientId: ctx?.oidc?.client?.clientId,
        params: ctx?.oidc?.params,
        prompt: ctx?.oidc?.prompt,
        sessionAccountId: ctx?.oidc?.session?.accountId,
        uid: ctx?.oidc?.uid
      }}`
    )
  })

  oidc.on('interaction.error', (ctx, err) => {
    logger.error(`[oidc-provider] interaction.error: ${err?.message}`)
    if (err?.stack) {
      logger.error(err.stack)
    }
  })

  oidc.on('authorization.error', (ctx, err) => {
    logger.error(`[oidc-provider] authorization.error: ${err?.message}`)
    if (err?.stack) {
      logger.error(err.stack)
    }
  })

  // Dynamic client loading (OPTION A: private_key_jwt only)
  oidc.Client.find = async (clientId) => {
    const c = await clientsService.getClient(clientId, Provider.ctx)
    if (!c) return undefined

    const tokenEndpointAuthMethod =
      c.token_endpoint_auth_method ?? 'private_key_jwt'

    return new oidc.Client({
      client_id: c.client_id,
      client_name: c.client_name,
      redirect_uris: c.redirect_uris,
      post_logout_redirect_uris: c.post_logout_redirect_uris ?? [],
      response_types: c.response_types ?? ['code'],
      grant_types: resolveClientGrantTypes(c),
      token_endpoint_auth_method: tokenEndpointAuthMethod,
      client_secret: c.client_secret ?? c.secret,
      jwks: c.jwks,
      scope: c.scope ?? 'openid'
    })
  }

  return oidc
}

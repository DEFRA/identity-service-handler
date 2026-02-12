import Provider from 'oidc-provider'
import { RedisAdapter } from './redis-adapter.js'

const CLAIM_NS = 'https://defra.gov.uk/claims/'
const CUSTOM_USERINFO_CLAIM = ['user', 'primaryCph', 'delegatedCph']

export function buildBrokerProvider({
  cookiePassword,
  issuer,
  redis,
  clientsService,
  userService
}) {
  const configuration = {
    adapter: (model) => new RedisAdapter(model, redis, 'oidc'),

    features: {
      devInteractions: { enabled: false }
    },

    responseTypes: ['code'],
    grantTypes: ['authorization_code'],

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
      profile: ['firstName', 'lastName'],
      email: ['email']
    },

    interactions: {
      url(ctx, interaction) {
        return `/interaction/${interaction.uid}`
      }
    },

    routes: {
      authorization: '/authorize',
      end_session: '/signout',
      userinfo: '/userinfo'
    },

    async findAccount(ctx, sub) {
      return {
        accountId: sub,
        async claims(use) {
          return await userService.getUserContext(ctx.request, sub)
        }
      }
    }
  }

  const oidc = new Provider(issuer, configuration)

  oidc.on('server_error', (ctx, err) => {
    console.error('[oidc-provider] server_error:', err?.message)
    if (err?.stack) {
      console.error(err.stack)
    }
    console.error('[oidc-provider] context:', {
      route: ctx?.request?.url,
      method: ctx?.request?.method,
      clientId: ctx?.oidc?.client?.clientId,
      params: ctx?.oidc?.params,
      prompt: ctx?.oidc?.prompt,
      sessionAccountId: ctx?.oidc?.session?.accountId,
      uid: ctx?.oidc?.uid
    })
  })

  oidc.on('interaction.error', (ctx, err) => {
    console.error('[oidc-provider] interaction.error:', err?.message)
    if (err?.stack) {
      console.error(err.stack)
    }
  })

  oidc.on('authorization.error', (ctx, err) => {
    console.error('[oidc-provider] authorization.error:', err?.message)
    if (err?.stack) {
      console.error(err.stack)
    }
  })

  // Dynamic client loading (OPTION A: private_key_jwt only)
  oidc.Client.find = async (clientId) => {
    const c = await clientsService.getClient(clientId, Provider.ctx)
    if (!c) return undefined

    const tokenEndpointAuthMethod =
      c.token_endpoint_auth_method ?? 'private_key_jwt'

    const tmp = new oidc.Client({
      client_id: c.client_id,
      client_name: c.client_name,
      redirect_uris: c.redirect_uris,
      post_logout_redirect_uris: c.post_logout_redirect_uris ?? [],
      response_types: c.response_types ?? ['code'],
      grant_types: c.grant_types ?? ['authorization_code'],
      token_endpoint_auth_method: tokenEndpointAuthMethod,
      client_secret: c.client_secret ?? c.secret,
      jwks: c.jwks,
      scope: c.scope ?? 'openid'
    })

    return tmp
  }

  return oidc
}

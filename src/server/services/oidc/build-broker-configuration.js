import { RedisAdapter } from './redis-adapter.js'
import { postLogoutSuccessSource } from './post-logout-success-source.js'

const CUSTOM_USERINFO_CLAIM = [
  'email',
  'given_name',
  'family_name',
  'display_name',
  'primary_cph',
  'delegated_cph'
]

/**
 * Builds the oidc-provider configuration object.
 *
 * @param {object} options
 * @param {string} options.cookiePassword
 * @param {boolean} options.sessionCookieSecure
 * @param {object} options.redis
 * @param {object} options.userService
 * @returns {object}
 */
export function buildBrokerConfiguration({
  cookiePassword,
  sessionCookieSecure,
  redis,
  userService
}) {
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
          postLogoutSuccessSource(ctx, sessionCookieSecure)
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
          return await userService.getUserContext(sub)
        }
      }
    }
  }
}

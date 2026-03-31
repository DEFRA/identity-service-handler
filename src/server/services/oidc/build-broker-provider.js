import Provider from 'oidc-provider'
import { logger } from '../../common/helpers/logging/logger.js'
import { buildBrokerConfiguration } from './build-broker-configuration.js'
import { findClient } from './find-client.js'

export function buildBrokerProvider({
  cookiePassword,
  sessionCookieSecure,
  issuer,
  redis,
  clientsService,
  userService
}) {
  const oidc = new Provider(
    issuer,
    buildBrokerConfiguration({
      cookiePassword,
      sessionCookieSecure,
      redis,
      userService
    })
  )

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

  // Dynamic client loading
  oidc.Client.find = (clientId) =>
    findClient(clientId, clientsService, oidc.Client)

  return oidc
}

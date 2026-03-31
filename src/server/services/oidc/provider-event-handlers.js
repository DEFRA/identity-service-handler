import { logger } from '../../common/helpers/logging/logger.js'

export const onServerError = (ctx, err) => {
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
}

export const onInteractionError = (ctx, err) => {
  logger.error(`[oidc-provider] interaction.error: ${err?.message}`)
  if (err?.stack) {
    logger.error(err.stack)
  }
}

export const onAuthorizationError = (ctx, err) => {
  logger.error(`[oidc-provider] authorization.error: ${err?.message}`)
  if (err?.stack) {
    logger.error(err.stack)
  }
}

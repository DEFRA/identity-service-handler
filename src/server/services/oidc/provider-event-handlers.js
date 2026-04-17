import { logger } from '../../common/helpers/logging/logger.js'
import { dump } from '../../../config/nunjucks/filters/debug-funcs.js'

export const onServerError = (ctx, err) => {
  logger.error(`[oidc-provider] server_error: ${err?.message}`)
  if (err?.stack) {
    logger.error(err.stack)
  }
  logger.error(
    `[oidc-provider] context: ${dump({
      route: ctx?.request?.url,
      method: ctx?.request?.method,
      clientId: ctx?.oidc?.client?.clientId,
      params: ctx?.oidc?.params,
      prompt: ctx?.oidc?.prompt,
      sessionAccountId: ctx?.oidc?.session?.accountId,
      uid: ctx?.oidc?.uid
    })}`
  )
}

export const onInteractionError = (_ctx, err) => {
  logger.error(`[oidc-provider] interaction.error: ${err?.message}`)
  if (err?.stack) {
    logger.error(err.stack)
  }
}

export const onAuthorizationError = (_ctx, err) => {
  logger.error(`[oidc-provider] authorization.error: ${err?.message}`)
  if (err?.stack) {
    logger.error(err.stack)
  }
}

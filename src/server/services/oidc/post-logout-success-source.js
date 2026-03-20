import { SIGNOUT_REDIRECT_COOKIE_NAME } from '../../oidc/constants.js'
import { decodeSignoutRedirect } from './decode-signout-redirect.js'

/**
 * Handles the post-logout redirect by reading the signout cookie,
 * clearing it, and redirecting the user.
 *
 * @param {object} ctx
 * @param {boolean} sessionCookieSecure
 */
export function postLogoutSuccessSource(ctx, sessionCookieSecure) {
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

import { postLogoutSuccessSource } from './post-logout-success-source.js'
import { SIGNOUT_REDIRECT_COOKIE_NAME } from '../../oidc/constants.js'

const buildCtx = (cookieValue) => ({
  cookies: {
    get: vi.fn().mockReturnValue(cookieValue),
    set: vi.fn()
  },
  redirect: vi.fn(),
  status: null
})

describe('postLogoutSuccessSource()', () => {
  afterEach(() => {
    vi.resetAllMocks()
  })

  test('it redirects to the decoded cookie value', () => {
    // Arrange
    const ctx = buildCtx('/post%2Flogout')
    const sessionCookieSecure = false

    // Act
    postLogoutSuccessSource(ctx, sessionCookieSecure)

    // Assert
    expect(ctx.redirect).toHaveBeenCalledWith('/post/logout')
    expect(ctx.status).toBe(303)
  })

  test('it redirects to / when the cookie is missing', () => {
    // Arrange
    const ctx = buildCtx(undefined)
    const sessionCookieSecure = false

    // Act
    postLogoutSuccessSource(ctx, sessionCookieSecure)

    // Assert
    expect(ctx.redirect).toHaveBeenCalledWith('/')
    expect(ctx.status).toBe(303)
  })

  test('it clears the signout redirect cookie', () => {
    // Arrange
    const ctx = buildCtx('/dashboard')
    const sessionCookieSecure = true

    // Act
    postLogoutSuccessSource(ctx, sessionCookieSecure)

    // Assert
    expect(ctx.cookies.set).toHaveBeenCalledWith(
      SIGNOUT_REDIRECT_COOKIE_NAME,
      null,
      {
        path: '/',
        secure: true,
        httpOnly: true,
        sameSite: 'lax'
      }
    )
  })
})

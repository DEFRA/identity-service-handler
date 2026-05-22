import { describe, expect, test, vi } from 'vitest'
import { cookiesController } from './cookies-controller.js'

describe('cookiesController', () => {
  test('it renders the cookies view with the correct page title', () => {
    // Arrange
    const view = vi.fn()
    const h = { view }

    // Act
    let result, error
    try {
      result = cookiesController.handler({}, h)
    } catch (e) {
      error = e
    }

    // Assert
    expect(error).not.toBeDefined()
    expect(view).toHaveBeenCalledWith('cookies/index', { pageTitle: 'Cookies' })
    expect(result).toBe(view.mock.results[0].value)
  })
})

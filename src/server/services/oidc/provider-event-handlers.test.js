import { describe, test, expect, vi, afterEach } from 'vitest'
import { logger } from '../../common/helpers/logging/logger.js'
import {
  onServerError,
  onInteractionError,
  onAuthorizationError
} from './provider-event-handlers.js'

const mocks = {
  loggerError: vi.spyOn(logger, 'error').mockImplementation(() => {})
}

afterEach(() => {
  vi.clearAllMocks()
})

describe('onServerError()', () => {
  test('it logs the error message and context', () => {
    // Arrange
    const ctx = {
      request: { url: '/authorize', method: 'GET' },
      oidc: { uid: 'uid-1' }
    }
    const err = new Error('Something undesirable occurred!')

    // Act
    onServerError(ctx, err)

    // Assert
    expect(mocks.loggerError).toHaveBeenCalledWith(
      '[oidc-provider] server_error: Something undesirable occurred!'
    )
    expect(mocks.loggerError).toHaveBeenCalledWith(
      expect.stringContaining('[oidc-provider] context:')
    )
  })

  test('it logs the stack when present', () => {
    // Arrange
    const ctx = {}
    const err = new Error('Something broke!')

    // Act
    onServerError(ctx, err)

    // Assert
    expect(mocks.loggerError).toHaveBeenCalledWith(err.stack)
  })

  test('it does not log the stack when absent', () => {
    // Arrange
    const ctx = {}
    const err = { message: 'No stack here' }

    // Act
    onServerError(ctx, err)

    // Assert
    expect(mocks.loggerError).toHaveBeenCalledTimes(2)
  })
})

describe('onInteractionError()', () => {
  test('it logs the error message', () => {
    // Arrange
    const ctx = {}
    const err = new Error('Erranu!')

    // Act
    onInteractionError(ctx, err)

    // Assert
    expect(mocks.loggerError).toHaveBeenCalledWith(
      '[oidc-provider] interaction.error: Erranu!'
    )
  })

  test('it logs the stack when present', () => {
    // Arrange
    const ctx = {}
    const err = new Error('Something bad happened!')

    // Act
    onInteractionError(ctx, err)

    // Assert
    expect(mocks.loggerError).toHaveBeenCalledWith(err.stack)
  })

  test('it does not log the stack when absent', () => {
    // Arrange
    const ctx = {}
    const err = { message: 'No stack here' }

    // Act
    onInteractionError(ctx, err)

    // Assert
    expect(mocks.loggerError).toHaveBeenCalledTimes(1)
  })
})

describe('onAuthorizationError()', () => {
  test('it logs the error message', () => {
    // Arrange
    const ctx = {}
    const err = new Error('Boom!')

    // Act
    onAuthorizationError(ctx, err)

    // Assert
    expect(mocks.loggerError).toHaveBeenCalledWith(
      '[oidc-provider] authorization.error: Boom!'
    )
  })

  test('it logs the stack when present', () => {
    // Arrange
    const ctx = {}
    const err = new Error('Bang!')

    // Act
    onAuthorizationError(ctx, err)

    // Assert
    expect(mocks.loggerError).toHaveBeenCalledWith(err.stack)
  })

  test('it does not log the stack when absent', () => {
    // Arrange
    const ctx = {}
    const err = { message: 'No stack here' }

    // Act
    onAuthorizationError(ctx, err)

    // Assert
    expect(mocks.loggerError).toHaveBeenCalledTimes(1)
  })
})

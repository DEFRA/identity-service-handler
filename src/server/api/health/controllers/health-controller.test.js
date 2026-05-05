import { describe, expect, test, vi } from 'vitest'
import { statusCodes } from '../../../common/constants/status-codes.js'
import { healthController } from './health-controller.js'

describe('healthController', () => {
  test('it returns a success response', () => {
    // Arrange
    const mockCode = vi.fn()
    const h = { response: vi.fn().mockReturnValue({ code: mockCode }) }

    // Act
    healthController.handler(null, h)

    // Assert
    expect(h.response).toHaveBeenCalledWith({ message: 'success' })
    expect(mockCode).toHaveBeenCalledWith(statusCodes.ok)
  })
})

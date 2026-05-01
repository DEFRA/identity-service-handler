import { afterEach, describe, expect, test, vi } from 'vitest'

vi.mock('../../server.js', () => ({
  createServer: vi.fn()
}))

import { createServer } from '../../server.js'
import { config } from '../../../config/config.js'
import { startServer } from './start-server.js'

describe('startServer', () => {
  afterEach(() => {
    vi.resetAllMocks()
  })

  test('it starts the server and returns it', async () => {
    // Arrange
    const mockServer = {
      start: vi.fn().mockResolvedValue(undefined),
      logger: { info: vi.fn() }
    }
    vi.mocked(createServer).mockResolvedValue(mockServer)
    vi.spyOn(config, 'get').mockReturnValue(3000)

    // Act
    const result = await startServer()

    // Assert
    expect(createServer).toHaveBeenCalled()
    expect(mockServer.start).toHaveBeenCalled()
    expect(mockServer.logger.info).toHaveBeenCalledWith(
      'Server started successfully'
    )
    expect(result).toBe(mockServer)
  })
})

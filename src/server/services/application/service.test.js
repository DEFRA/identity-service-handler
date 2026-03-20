import helperClient from '../../clients/helperClient.js'
import { get } from './service.js'

const mocks = {
  helperClientGet: vi.spyOn(helperClient, 'get')
}

describe('application service', () => {
  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('get()', () => {
    test('it returns the application payload for a given client id', async () => {
      // Arrange
      const application = { id: '1', name: 'Test App', client_id: 'abc-123' }
      mocks.helperClientGet.mockResolvedValue({ payload: application })

      // Act
      const result = await get('abc-123')

      // Assert
      expect(mocks.helperClientGet).toHaveBeenCalledWith(
        '/applications/abc-123'
      )
      expect(result).toEqual(application)
    })

    test('it propagates errors from the helper client', async () => {
      // Arrange
      mocks.helperClientGet.mockRejectedValue(new Error('Request failed - 404'))

      // Act
      let error
      try {
        await get('unknown')
      } catch (e) {
        error = e
      }

      // Assert
      expect(error).toBeInstanceOf(Error)
      expect(error?.message).toBe('Request failed - 404')
    })
  })
})

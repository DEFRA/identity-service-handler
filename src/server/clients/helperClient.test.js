import Wreck from '@hapi/wreck'
import { config } from '../../config/config.js'
import * as apiHeaders from '../common/helpers/api-headers.js'
import helper from './helperClient.js'

const mocks = {
  wreck: {
    get: vi.spyOn(Wreck, 'get'),
    post: vi.spyOn(Wreck, 'post'),
    put: vi.spyOn(Wreck, 'put'),
    patch: vi.spyOn(Wreck, 'patch'),
    delete: vi.spyOn(Wreck, 'delete')
  },
  generateHeaders: vi.spyOn(apiHeaders, 'generateHeaders'),
  configGet: vi.spyOn(config, 'get')
}

describe('helper client', () => {
  const mockHeaders = {
    'x-api-key': 'test-key',
    'x-operator-id': 'op-123',
    'x-correlation-id': 'corr-456'
  }
  const mockPayload = { data: 'test' }
  const mockResponse = { res: { statusCode: 200 }, payload: mockPayload }

  beforeEach(() => {
    mocks.configGet.mockReturnValue('https://helper.example.com')
    mocks.generateHeaders.mockReturnValue(mockHeaders)
    for (const spy of Object.values(mocks.wreck)) {
      spy.mockResolvedValue(mockResponse)
    }
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('successful requests', () => {
    test('returns the Wreck result', async () => {
      const result = await helper.get('/path')

      expect(result).toBe(mockResponse)
    })

    test.each([['get'], ['post'], ['put'], ['patch'], ['delete']])(
      '%s() calls the correct Wreck method with baseUrl, headers and json',
      async (method) => {
        await helper[method]('/some/path')

        expect(mocks.wreck[method]).toHaveBeenCalledWith('/some/path', {
          baseUrl: 'https://helper.example.com',
          json: true,
          headers: mockHeaders
        })
      }
    )
  })

  describe('error handling', () => {
    const makeWreckError = (statusCode, payload) => {
      const err = new Error('http error')
      err.output = { statusCode }
      err.data = { payload }
      return err
    }

    describe('when Wreck throws', () => {
      test('handles JsonErrorMiddleware format', async () => {
        // Arrange
        mocks.wreck.get.mockRejectedValue(
          makeWreckError(500, {
            error: { code: 'SOME_ERROR', message: 'something went wrong' }
          })
        )
        let error

        // Act
        try {
          await helper.get('/path')
        } catch (e) {
          error = e
        }

        // Assert
        expect(error.message).toBe('SOME_ERROR - something went wrong')
      })

      test('handles ProblemDetails format', async () => {
        // Arrange
        mocks.wreck.get.mockRejectedValue(
          makeWreckError(500, {
            status: 500,
            title: 'Internal Server Error',
            detail: 'exception message'
          })
        )
        let error

        // Act
        try {
          await helper.get('/path')
        } catch (e) {
          error = e
        }

        // Assert
        expect(error.message).toBe('500 - exception message')
      })

      test('handles ProblemDetails format with no detail', async () => {
        // Arrange
        mocks.wreck.get.mockRejectedValue(
          makeWreckError(404, { status: 404, title: 'Not Found' })
        )
        let error

        // Act
        try {
          await helper.get('/path')
        } catch (e) {
          error = e
        }

        // Assert
        expect(error.message).toBe('404 - Not Found')
      })

      test('handles validation error format (422)', async () => {
        // Arrange
        mocks.wreck.get.mockRejectedValue(
          makeWreckError(422, { PropertyName: ['must not be empty'] })
        )
        let error

        // Act
        try {
          await helper.get('/path')
        } catch (e) {
          error = e
        }

        // Assert
        expect(error.message).toBe('Validation failed')
      })

      test('falls back to status code for unrecognised format', async () => {
        // Arrange
        mocks.wreck.get.mockRejectedValue(makeWreckError(503, null))
        let error

        // Act
        try {
          await helper.get('/path')
        } catch (e) {
          error = e
        }

        // Assert
        expect(error.message).toBe('Request failed - 503')
      })
    })

    describe('when Wreck returns a non-2xx response', () => {
      test('throws using the response payload', async () => {
        // Arrange
        mocks.wreck.get.mockResolvedValue({
          res: { statusCode: 404 },
          payload: { status: 404, title: 'Not Found' }
        })
        let error

        // Act
        try {
          await helper.get('/path')
        } catch (e) {
          error = e
        }

        // Assert
        expect(error.message).toBe('404 - Not Found')
      })
    })
  })
})

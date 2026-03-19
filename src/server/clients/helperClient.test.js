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
  const mockResponse = { payload: { data: 'test' } }

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

  test('passes correlationId from options to generateHeaders', async () => {
    await helper.get('/path', { correlationId: 'my-correlation-id' })

    expect(mocks.generateHeaders).toHaveBeenCalledWith(
      'helper',
      'my-correlation-id'
    )
  })

  test('merges caller-provided headers with generated headers', async () => {
    await helper.get('/path', { headers: { 'x-custom': 'value' } })

    expect(mocks.wreck.get).toHaveBeenCalledWith(
      '/path',
      expect.objectContaining({
        headers: { ...mockHeaders, 'x-custom': 'value' }
      })
    )
  })

  test('spreads additional options into the Wreck call', async () => {
    await helper.get('/path', { payload: { key: 'value' } })

    expect(mocks.wreck.get).toHaveBeenCalledWith(
      '/path',
      expect.objectContaining({ payload: { key: 'value' } })
    )
  })

  test.each([['get'], ['post'], ['put'], ['patch'], ['delete']])(
    '%s() calls the correct Wreck method with baseUrl, headers and json',
    async (method) => {
      const result = await helper[method]('/some/path')

      expect(mocks.wreck[method]).toHaveBeenCalledWith('/some/path', {
        baseUrl: 'https://helper.example.com',
        json: true,
        headers: mockHeaders
      })
      expect(result).toBe(mockResponse)
    }
  )
})

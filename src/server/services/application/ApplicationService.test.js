import { ApplicationService } from './ApplicationService.js'
import { config } from '../../../config/config.js'
import * as service from './service.js'
import * as serviceFake from './service.fake.js'

const mocks = {
  configGet: vi.spyOn(config, 'get'),
  serviceGet: vi.spyOn(service, 'get'),
  serviceFakeGet: vi.spyOn(serviceFake, 'get')
}

describe('ApplicationService', () => {
  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('get()', () => {
    test('it delegates to the real service when useFakeClient is false', async () => {
      // Arrange
      const application = { id: '1', client_id: 'abc-123' }
      mocks.configGet.mockReturnValue({ useFakeClient: false })
      mocks.serviceGet.mockResolvedValue(application)
      const applicationService = new ApplicationService(config)

      // Act
      const result = await applicationService.get('abc-123')

      // Assert
      expect(mocks.serviceGet).toHaveBeenCalledWith('abc-123')
      expect(mocks.serviceFakeGet).not.toHaveBeenCalled()
      expect(result).toEqual(application)
    })

    test('it delegates to the fake service when useFakeClient is true', async () => {
      // Arrange
      const application = { id: '1', client_id: 'abc-123' }
      mocks.configGet.mockReturnValue({ useFakeClient: true })
      mocks.serviceFakeGet.mockResolvedValue(application)
      const applicationService = new ApplicationService(config)

      // Act
      const result = await applicationService.get('abc-123')

      // Assert
      expect(mocks.serviceFakeGet).toHaveBeenCalledWith('abc-123')
      expect(mocks.serviceGet).not.toHaveBeenCalled()
      expect(result).toEqual(application)
    })
  })
})

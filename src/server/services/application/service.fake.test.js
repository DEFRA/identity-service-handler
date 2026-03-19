import { get } from './service.fake.js'

const KNOWN_CLIENT_ID = 'a3d4e5f6-7890-4b1c-a2d3-e4f567890abc'

describe('application fake service', () => {
  describe('get()', () => {
    test('returns the application for a known client id', async () => {
      // Act
      const result = await get(KNOWN_CLIENT_ID)

      // Assert
      expect(result).toMatchObject({
        client_id: KNOWN_CLIENT_ID,
        name: 'Auth Test Application'
      })
    })

    test('returns undefined for an unknown client id', async () => {
      // Act
      const result = await get('unknown-client-id')

      // Assert
      expect(result).toBeUndefined()
    })
  })
})

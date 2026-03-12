import { SubjectsService } from '../subjects.js'
import { getUserDetails, getUserCphs } from './service.fake.js'

const DEFAULT_SUB = SubjectsService.generateBrokerSub(
  'dummy-issuer',
  '043f9538-b6b3-41aa-8010-3fb4f310e2b1',
  'default_user@example.com'
)

const TEST_SUB = SubjectsService.generateBrokerSub(
  'dummy-issuer',
  'a17a772c-604e-495d-950e-3dbee2ba6e98',
  'max.bladen-clark@esynergy.co.uk'
)

describe('service.fake', () => {
  describe('getUserDetails()', () => {
    test('it returns user details for a known sub', async () => {
      // Act
      const result = await getUserDetails(TEST_SUB)

      // Assert
      expect(result).toMatchObject({
        display_name: 'Max Bladen-Clark',
        given_name: 'Max',
        family_name: 'Bladen-Clark'
      })
    })

    test('it returns the default user details when looked up by default sub', async () => {
      // Act
      const result = await getUserDetails(DEFAULT_SUB)

      // Assert
      expect(result).toMatchObject({
        display_name: 'Default User',
        given_name: 'Default',
        family_name: 'User'
      })
    })

    test('it falls back to the default user when the sub is not found', async () => {
      // Act
      const result = await getUserDetails('unknown-sub')

      // Assert
      expect(result).toMatchObject({
        display_name: 'Default User',
        given_name: 'Default',
        family_name: 'User'
      })
    })
  })

  describe('getUserCphs()', () => {
    test('it returns cph assignments for a known sub', async () => {
      // Act
      const result = await getUserCphs(TEST_SUB)

      // Assert
      expect(result).toMatchObject({
        primary_cph: [{ cph: '44/081/0006', role: 'Owner' }]
      })
    })
  })
})

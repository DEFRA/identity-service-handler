import { describe, test, expect, vi } from 'vitest'
import { SubjectsService } from '../subjects.js'
import { getUserDetails, getUserCphs } from './service.fake.js'

vi.mock('../../../data/users.json', () => ({
  default: [
    {
      iss: 'dummy-issuer',
      sub: '043f9538-b6b3-41aa-8010-3fb4f310e2b1',
      email: 'default_user@example.com',
      display_name: 'Default User',
      given_name: 'Default',
      family_name: 'User',
      primary_cph: [{ cph: '00/000/0000', role: 'Owner' }],
      delegated_cph: []
    },
    {
      iss: 'test-issuer',
      sub: 'test-sub-123',
      email: 'test@example.com',
      display_name: 'Test User',
      given_name: 'Test',
      family_name: 'User',
      primary_cph: [{ cph: '12/500/0001', role: 'Owner' }],
      delegated_cph: [{ cph: '99/888/0001', role: 'Delegate' }]
    }
  ]
}))

const DEFAULT_SUB = SubjectsService.generateBrokerSub(
  'dummy-issuer',
  '043f9538-b6b3-41aa-8010-3fb4f310e2b1',
  'default_user@example.com'
)

const TEST_SUB = SubjectsService.generateBrokerSub(
  'test-issuer',
  'test-sub-123',
  'test@example.com'
)

describe('service.fake', () => {
  describe('getUserDetails()', () => {
    test('it returns user details for a known sub', async () => {
      // Arrange
      const sub = TEST_SUB

      // Act
      const result = await getUserDetails(sub)

      // Assert
      expect(result).toEqual({
        email: 'test@example.com',
        display_name: 'Test User',
        given_name: 'Test',
        family_name: 'User'
      })
    })

    test('it returns the default user details when looked up by default sub', async () => {
      // Arrange
      const sub = DEFAULT_SUB

      // Act
      const result = await getUserDetails(sub)

      // Assert
      expect(result).toEqual({
        email: 'default_user@example.com',
        display_name: 'Default User',
        given_name: 'Default',
        family_name: 'User'
      })
    })

    test('it falls back to the default user when the sub is not found', async () => {
      // Arrange
      const sub = 'unknown-sub'

      // Act
      const result = await getUserDetails(sub)

      // Assert
      expect(result).toEqual({
        email: 'default_user@example.com',
        display_name: 'Default User',
        given_name: 'Default',
        family_name: 'User'
      })
    })
  })

  describe('getUserCphs()', () => {
    test('it returns cph assignments for a known sub', async () => {
      // Arrange
      const sub = TEST_SUB

      // Act
      const result = await getUserCphs(sub)

      // Assert
      expect(result).toEqual({
        primary_cph: [{ cph: '12/500/0001', role: 'Owner' }],
        delegated_cph: [{ cph: '99/888/0001', role: 'Delegate' }]
      })
    })

    test('it falls back to the default user when the sub is not found', async () => {
      // Arrange
      const sub = 'unknown-sub'

      // Act
      const result = await getUserCphs(sub)

      // Assert
      expect(result).toEqual({
        primary_cph: [{ cph: '00/000/0000', role: 'Owner' }],
        delegated_cph: []
      })
    })
  })
})

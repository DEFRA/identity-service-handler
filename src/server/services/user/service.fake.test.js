import { describe, expect, test, vi } from 'vitest'
import { getUserCphs, getUserDetails } from './service.fake.js'

vi.mock('../../../data/users.json', () => ({
  default: [
    {
      iss: 'dummy-issuer',
      sub: 'default-sub-987',
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

describe('service.fake', () => {
  describe('getUserDetails()', () => {
    test('it returns user details for a known sub', async () => {
      // Arrange
      const sub = 'test-sub-123'

      // Act
      const result = await getUserDetails(sub)

      // Assert
      expect(result).toEqual({
        id: 'test-sub-123',
        email: 'test@example.com',
        display_name: 'Test User',
        given_name: 'Test',
        family_name: 'User'
      })
    })

    test('it returns the default user details when looked up by default sub', async () => {
      // Arrange
      const sub = 'default-sub-987'

      // Act
      const result = await getUserDetails(sub)

      // Assert
      expect(result).toEqual({
        id: 'default-sub-987',
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
        id: 'unknown-sub',
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
      const sub = 'test-sub-123'

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

import { describe, expect, test, vi } from 'vitest'
import { getUserProfile } from './service.fake.js'

vi.mock('../../../data/users.json', () => ({
  default: [
    {
      iss: 'dummy-issuer',
      sub: 'default-sub-987',
      email: 'default_user@example.com',
      display_name: 'Default User',
      given_name: 'Default',
      family_name: 'User',
      assignments: [{ county_parish_holding_number: '00/000/0000' }],
      delegations: []
    },
    {
      iss: 'test-issuer',
      sub: 'test-sub-123',
      email: 'test@example.com',
      display_name: 'Test User',
      given_name: 'Test',
      family_name: 'User',
      assignments: [{ county_parish_holding_number: '12/500/0001' }],
      delegations: [
        {
          county_parish_holding_number: '99/888/0001',
          delegated_user_role_name: 'Delegate'
        }
      ]
    }
  ]
}))

describe('service.fake', () => {
  describe('getUserProfile()', () => {
    test('it returns a profile for a known sub', async () => {
      const result = await getUserProfile('test-sub-123')

      expect(result).toEqual({
        user_details: {
          id: 'test-sub-123',
          email: 'test@example.com',
          first_name: 'Test',
          last_name: 'User',
          display_name: 'Test User'
        },
        direct_assignments: [{ county_parish_holding_number: '12/500/0001' }],
        inbound_delegations: [
          {
            county_parish_holding_number: '99/888/0001',
            delegated_user_role_name: 'Delegate',
            expires_at: null,
            active: true
          }
        ],
        outbound_delegations: []
      })
    })

    test('it falls back to the default user when the sub is not found', async () => {
      const result = await getUserProfile('unknown-sub')

      expect(result.user_details.email).toBe('default_user@example.com')
      expect(result.direct_assignments).toEqual([
        { county_parish_holding_number: '00/000/0000' }
      ])
      expect(result.inbound_delegations).toEqual([])
    })
  })
})

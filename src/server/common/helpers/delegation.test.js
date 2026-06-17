import { describe, expect, test } from 'vitest'
import {
  getDelegates,
  getDelegate,
  getPendingInvitations,
  getAcceptedInboundDelegations
} from './delegation.js'

const profile = {
  outbound_delegations: [
    {
      id: 'del-1',
      delegated_user_id: 'user-b',
      delegated_user_email: 'b@example.gov.uk',
      county_parish_holding_id: 'cph-1',
      county_parish_holding_number: '10/100/0001',
      invitation_expires_at: '2024-01-08T00:00:00Z'
    },
    {
      id: 'del-2',
      delegated_user_id: 'user-a',
      delegated_user_email: 'a@example.gov.uk',
      county_parish_holding_id: 'cph-2',
      county_parish_holding_number: '10/100/0002',
      invitation_expires_at: '2024-01-10T00:00:00Z'
    },
    {
      id: 'del-3',
      delegated_user_id: 'user-b',
      delegated_user_email: 'b@example.gov.uk',
      county_parish_holding_id: 'cph-3',
      county_parish_holding_number: '10/100/0003',
      invitation_expires_at: '2024-01-15T00:00:00Z'
    }
  ]
}

describe('getDelegates()', () => {
  test('it groups delegations by delegate and collects CPHs', () => {
    const result = getDelegates(profile)

    expect(result).toEqual([
      {
        id: 'user-b',
        email: 'b@example.gov.uk',
        createdAt: new Date('2024-01-08T00:00:00Z'),
        cphs: [
          {
            county_parish_holding_id: 'cph-1',
            county_parish_holding_number: '10/100/0001',
            delegation_id: 'del-1'
          },
          {
            county_parish_holding_id: 'cph-3',
            county_parish_holding_number: '10/100/0003',
            delegation_id: 'del-3'
          }
        ]
      },
      {
        id: 'user-a',
        email: 'a@example.gov.uk',
        createdAt: new Date('2024-01-10T00:00:00Z'),
        cphs: [
          {
            county_parish_holding_id: 'cph-2',
            county_parish_holding_number: '10/100/0002',
            delegation_id: 'del-2'
          }
        ]
      }
    ])
  })

  test('it uses the earliest invitation_expires_at as createdAt when a delegate has multiple CPHs', () => {
    // Arrange
    const multiCphProfile = {
      outbound_delegations: [
        {
          id: 'del-1',
          delegated_user_id: 'user-b',
          delegated_user_email: 'b@example.gov.uk',
          county_parish_holding_id: 'cph-1',
          county_parish_holding_number: '10/100/0001',
          invitation_expires_at: '2024-03-01T00:00:00Z'
        },
        {
          id: 'del-2',
          delegated_user_id: 'user-b',
          delegated_user_email: 'b@example.gov.uk',
          county_parish_holding_id: 'cph-2',
          county_parish_holding_number: '10/100/0002',
          invitation_expires_at: '2024-01-01T00:00:00Z'
        }
      ]
    }

    // Act
    const result = getDelegates(multiCphProfile)

    // Assert
    expect(result[0].createdAt).toEqual(new Date('2024-01-01T00:00:00Z'))
  })

  test('it returns an empty array when there are no outbound delegations', () => {
    const result = getDelegates({ outbound_delegations: [] })

    expect(result).toEqual([])
  })
})

describe('getDelegate()', () => {
  test('it returns the delegate for the given user id', () => {
    const result = getDelegate(profile, 'user-a')

    expect(result).toEqual({
      id: 'user-a',
      email: 'a@example.gov.uk',
      createdAt: new Date('2024-01-10T00:00:00Z'),
      cphs: [
        {
          county_parish_holding_id: 'cph-2',
          county_parish_holding_number: '10/100/0002',
          delegation_id: 'del-2'
        }
      ]
    })
  })

  test('it returns undefined when the user is not a delegate', () => {
    const result = getDelegate(profile, 'unknown-user')

    expect(result).toBeUndefined()
  })
})

describe('getPendingInvitations()', () => {
  const pending = {
    id: 'del-1',
    invitation_accepted_at: null,
    invitation_rejected_at: null,
    revoked_at: null
  }

  test('it returns pending inbound delegations', () => {
    const result = getPendingInvitations({ inbound_delegations: [pending] })

    expect(result).toEqual([pending])
  })

  test('it filters out accepted delegations', () => {
    const result = getPendingInvitations({
      inbound_delegations: [
        { ...pending, invitation_accepted_at: '2024-01-01T00:00:00Z' }
      ]
    })

    expect(result).toEqual([])
  })

  test('it filters out rejected delegations', () => {
    const result = getPendingInvitations({
      inbound_delegations: [
        { ...pending, invitation_rejected_at: '2024-01-01T00:00:00Z' }
      ]
    })

    expect(result).toEqual([])
  })

  test('it filters out revoked delegations', () => {
    const result = getPendingInvitations({
      inbound_delegations: [{ ...pending, revoked_at: '2024-01-01T00:00:00Z' }]
    })

    expect(result).toEqual([])
  })

  test('it returns an empty array when there are no inbound delegations', () => {
    const result = getPendingInvitations({ inbound_delegations: [] })

    expect(result).toEqual([])
  })
})

describe('getAcceptedInboundDelegations()', () => {
  const active = { id: 'del-1', active: true }
  const inactive = { id: 'del-2', active: false }

  test('it returns delegations where active is true', () => {
    // Arrange
    const profile = { inbound_delegations: [active, inactive] }

    // Act
    const result = getAcceptedInboundDelegations(profile)

    // Assert
    expect(result).toEqual([active])
  })

  test('it filters out delegations where active is false', () => {
    // Arrange
    const profile = { inbound_delegations: [inactive] }

    // Act
    const result = getAcceptedInboundDelegations(profile)

    // Assert
    expect(result).toEqual([])
  })

  test('it returns an empty array when there are no inbound delegations', () => {
    // Arrange
    const profile = { inbound_delegations: [] }

    // Act
    const result = getAcceptedInboundDelegations(profile)

    // Assert
    expect(result).toEqual([])
  })
})

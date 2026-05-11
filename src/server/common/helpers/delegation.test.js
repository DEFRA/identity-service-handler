import { describe, expect, test } from 'vitest'
import { getDelegates, getDelegate } from './delegation.js'

const profile = {
  outbound_delegations: [
    {
      id: 'del-1',
      delegated_user_id: 'user-b',
      delegated_user_email: 'b@example.gov.uk',
      county_parish_holding_id: 'cph-1',
      county_parish_holding_number: '10/100/0001'
    },
    {
      id: 'del-2',
      delegated_user_id: 'user-a',
      delegated_user_email: 'a@example.gov.uk',
      county_parish_holding_id: 'cph-2',
      county_parish_holding_number: '10/100/0002'
    },
    {
      id: 'del-3',
      delegated_user_id: 'user-b',
      delegated_user_email: 'b@example.gov.uk',
      county_parish_holding_id: 'cph-3',
      county_parish_holding_number: '10/100/0003'
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

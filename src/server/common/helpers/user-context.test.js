import { describe, expect, test } from 'vitest'
import { getUserContext } from './user-context.js'

const makeProfile = (overrides = {}) => ({
  user_details: {
    id: 'user-123',
    email: 'user@example.com',
    first_name: 'Test',
    last_name: 'User',
    display_name: 'Test User'
  },
  direct_assignments: [],
  inbound_delegations: [],
  outbound_delegations: [],
  ...overrides
})

describe('getUserContext()', () => {
  test('it maps profile fields to the user context shape', () => {
    const result = getUserContext(makeProfile())

    expect(result).toEqual({
      sub: 'user-123',
      email: 'user@example.com',
      given_name: 'Test',
      family_name: 'User',
      display_name: 'Test User',
      primary_cph: [],
      delegated_cph: []
    })
  })

  test('it maps direct assignments to primary_cph', () => {
    const profile = makeProfile({
      direct_assignments: [
        { county_parish_holding_number: '12/345/6789' },
        { county_parish_holding_number: '98/765/4321' }
      ]
    })

    const result = getUserContext(profile)

    expect(result.primary_cph).toEqual([
      { cph: '12/345/6789', expires: null },
      { cph: '98/765/4321', expires: null }
    ])
  })

  test('it maps inbound delegations to delegated_cph', () => {
    const future = Date.now() + 100000
    const profile = makeProfile({
      inbound_delegations: [
        {
          county_parish_holding_number: '11/111/1111',
          expires_at: new Date(future).toISOString()
        },
        { county_parish_holding_number: '22/222/2222' }
      ]
    })

    const result = getUserContext(profile)

    expect(result.delegated_cph).toEqual([
      { cph: '11/111/1111', expires: new Date(future).toISOString() },
      { cph: '22/222/2222', expires: null }
    ])
  })

  test('it filters out expired delegated cphs', () => {
    const past = Date.now() - 100000
    const future = Date.now() + 100000
    const profile = makeProfile({
      inbound_delegations: [
        {
          county_parish_holding_number: '11/111/1111',
          expires_at: new Date(future).toISOString()
        },
        {
          county_parish_holding_number: '22/222/2222',
          expires_at: new Date(past).toISOString()
        },
        { county_parish_holding_number: '33/333/3333' }
      ]
    })

    const result = getUserContext(profile)

    expect(result.delegated_cph).toEqual([
      { cph: '11/111/1111', expires: new Date(future).toISOString() },
      { cph: '33/333/3333', expires: null }
    ])
  })
})

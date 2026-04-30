import { afterEach, describe, expect, test, vi } from 'vitest'
import helperClient from '../clients/helperClient.js'
import { createInvite, revokeDelegation } from './delegation.js'

describe('createInvite()', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  test('it posts a single invitation', async () => {
    // Arrange
    vi.spyOn(helperClient, 'post').mockResolvedValue({})
    const invite = {
      countyParishHoldingId: 'cph-guid-1',
      delegatingUserId: 'user-guid-1',
      delegatedUserEmail: 'joe@example.gov.uk'
    }

    // Act
    await createInvite(invite)

    // Assert
    expect(helperClient.post).toHaveBeenCalledOnce()
    expect(helperClient.post).toHaveBeenCalledWith('/delegations', {
      payload: {
        county_parish_holding_id: 'cph-guid-1',
        delegating_user_id: 'user-guid-1',
        delegated_user_role_id: '0c15ba2f-b4ba-406a-a0ae-213de64600a9',
        delegated_user_email: 'joe@example.gov.uk',
        delegated_user_id: '00000000-0000-0000-0000-000000000001'
      }
    })
  })
})

describe('revokeDelegation()', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  test('it posts to the revoke endpoint', async () => {
    // Arrange
    vi.spyOn(helperClient, 'post').mockResolvedValue({})

    // Act
    await revokeDelegation('delegate-1')

    // Assert
    expect(helperClient.post).toHaveBeenCalledWith(
      '/delegations/delegate-1:revoke'
    )
  })
})

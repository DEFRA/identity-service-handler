import { afterEach, describe, expect, test, vi } from 'vitest'
import helperClient from '../clients/helperClient.js'
import {
  acceptInvitation,
  createInvite,
  getDefaultRoleId,
  getRoles,
  rejectInvitation,
  revokeDelegation
} from './delegation.js'

const mocks = {
  get: vi.spyOn(helperClient, 'get'),
  post: vi.spyOn(helperClient, 'post')
}

describe('getRoles()', () => {
  afterEach(() => {
    vi.resetAllMocks()
  })

  test('it returns the roles from the helper', async () => {
    // Arrange
    const roles = [{ id: 'role-id-1', name: 'agent', description: 'Agent' }]
    mocks.get.mockResolvedValue({ payload: roles })

    // Act
    const result = await getRoles()

    // Assert
    expect(helperClient.get).toHaveBeenCalledWith('/roles')
    expect(result).toEqual(roles)
  })
})

describe('getDefaultRoleId()', () => {
  afterEach(() => {
    vi.resetAllMocks()
  })

  test('it returns the id of the configured default role', async () => {
    // Arrange
    mocks.get.mockResolvedValue({
      payload: [
        { id: 'role-id-1', name: 'agent', description: 'Agent' },
        { id: 'role-id-2', name: 'citizen', description: 'Citizen' }
      ]
    })

    // Act
    let result, error
    try {
      result = await getDefaultRoleId()
    } catch (e) {
      error = e
    }

    // Assert
    expect(error).not.toBeDefined()
    expect(result).toBe('role-id-1')
  })

  test('it throws when the configured role name is not found', async () => {
    // Arrange
    mocks.get.mockResolvedValue({ payload: [] })

    // Act
    let error
    try {
      await getDefaultRoleId()
    } catch (e) {
      error = e
    }

    // Assert
    expect(error).toBeDefined()
    expect(error.message).toMatch('agent')
  })
})

describe('createInvite()', () => {
  afterEach(() => {
    vi.resetAllMocks()
  })

  test('it posts a single invitation', async () => {
    // Arrange
    mocks.post.mockResolvedValue({})
    const invite = {
      countyParishHoldingId: 'cph-guid-1',
      delegatingUserId: 'user-guid-1',
      delegatedUserEmail: 'joe@example.gov.uk',
      delegatedUserRoleId: 'role-id-1'
    }

    // Act
    await createInvite(invite)

    // Assert
    expect(helperClient.post).toHaveBeenCalledOnce()
    expect(helperClient.post).toHaveBeenCalledWith('/delegations', {
      payload: {
        county_parish_holding_id: 'cph-guid-1',
        delegating_user_id: 'user-guid-1',
        delegated_user_role_id: 'role-id-1',
        delegated_user_email: 'joe@example.gov.uk'
      }
    })
  })
})

describe('revokeDelegation()', () => {
  afterEach(() => {
    vi.resetAllMocks()
  })

  test('it posts to the revoke endpoint', async () => {
    // Arrange
    mocks.post.mockResolvedValue({})

    // Act
    await revokeDelegation('delegate-1')

    // Assert
    expect(helperClient.post).toHaveBeenCalledWith(
      '/delegations/delegate-1:revoke'
    )
  })
})

describe('acceptInvitation()', () => {
  afterEach(() => {
    vi.resetAllMocks()
  })

  test('it posts to the accept endpoint', async () => {
    // Arrange
    mocks.post.mockResolvedValue({})

    // Act
    await acceptInvitation('delegation-1')

    // Assert
    expect(helperClient.post).toHaveBeenCalledWith(
      '/delegations/delegation-1:accept'
    )
  })
})

describe('rejectInvitation()', () => {
  afterEach(() => {
    vi.resetAllMocks()
  })

  test('it posts to the reject endpoint', async () => {
    // Arrange
    mocks.post.mockResolvedValue({})

    // Act
    await rejectInvitation('delegation-1')

    // Assert
    expect(helperClient.post).toHaveBeenCalledWith(
      '/delegations/delegation-1:reject'
    )
  })
})

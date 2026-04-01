import { afterEach, describe, expect, test, vi } from 'vitest'
import helperClient from '../../clients/helperClient.js'
import {
  getDelegations,
  getDelegation,
  createInvite,
  updateDelegation,
  deleteDelegation
} from './service.js'

const userId = 'user-123'

describe('getDelegations()', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  test('it returns the payload from the delegations endpoint', async () => {
    // Arrange
    const payload = { page: 1, items: [], total_pages: 1, total_items: 0 }
    vi.spyOn(helperClient, 'get').mockResolvedValue({ payload })

    // Act
    const result = await getDelegations(userId, 1)

    // Assert
    expect(helperClient.get).toHaveBeenCalledWith(
      `/delegations/${userId}?page=1`
    )
    expect(result).toBe(payload)
  })
})

describe('getDelegation()', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  test('it returns the payload from the delegation endpoint', async () => {
    // Arrange
    const payload = {
      id: 'delegate-1',
      email: 'joe@example.gov.uk',
      cphs: [],
      active: true
    }
    vi.spyOn(helperClient, 'get').mockResolvedValue({ payload })

    // Act
    const result = await getDelegation(userId, 'delegate-1')

    // Assert
    expect(helperClient.get).toHaveBeenCalledWith(
      `/delegations/${userId}/delegate-1`
    )
    expect(result).toBe(payload)
  })
})

describe('createInvite()', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  test('it posts the invite to the delegations endpoint', async () => {
    // Arrange
    vi.spyOn(helperClient, 'post').mockResolvedValue({})
    const invite = { email: 'joe@example.gov.uk', cphs: ['12/345/6789'] }

    // Act
    await createInvite(userId, invite)

    // Assert
    expect(helperClient.post).toHaveBeenCalledWith(`/delegations/${userId}`, {
      payload: invite
    })
  })
})

describe('updateDelegation()', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  test('it patches the delegation endpoint with updates', async () => {
    // Arrange
    vi.spyOn(helperClient, 'patch').mockResolvedValue({})
    const updates = { active: true }

    // Act
    await updateDelegation(userId, 'delegate-1', updates)

    // Assert
    expect(helperClient.patch).toHaveBeenCalledWith(
      `/delegations/${userId}/delegate-1`,
      { payload: updates }
    )
  })
})

describe('deleteDelegation()', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  test('it calls delete on the delegation endpoint', async () => {
    // Arrange
    vi.spyOn(helperClient, 'delete').mockResolvedValue({})

    // Act
    await deleteDelegation(userId, 'delegate-1')

    // Assert
    expect(helperClient.delete).toHaveBeenCalledWith(
      `/delegations/${userId}/delegate-1`
    )
  })
})

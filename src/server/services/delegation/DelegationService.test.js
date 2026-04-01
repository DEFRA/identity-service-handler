import { afterEach, describe, expect, test, vi } from 'vitest'
import { DelegationService } from './DelegationService.js'
import { DelegationFakeService } from './service.fake.js'
import * as service from './service.js'

const redis = {}
const userId = 'user-123'

function makeConfig(useFake) {
  return { get: () => ({ useFakeClient: useFake }) }
}

describe('DelegationService (fake)', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  test('getDelegations() delegates to DelegationFakeService', async () => {
    // Arrange
    const expected = { page: 1, items: [], total_pages: 1, total_items: 0 }
    vi.spyOn(
      DelegationFakeService.prototype,
      'getDelegations'
    ).mockResolvedValue(expected)
    const delegationService = new DelegationService(redis, makeConfig(true))

    // Act
    const result = await delegationService.getDelegations(userId, 1)

    // Assert
    expect(DelegationFakeService.prototype.getDelegations).toHaveBeenCalledWith(
      userId,
      1
    )
    expect(result).toBe(expected)
  })

  test('getDelegation() delegates to DelegationFakeService', async () => {
    // Arrange
    const expected = {
      id: 'delegate-1',
      email: 'joe@example.gov.uk',
      active: true
    }
    vi.spyOn(
      DelegationFakeService.prototype,
      'getDelegation'
    ).mockResolvedValue(expected)
    const delegationService = new DelegationService(redis, makeConfig(true))

    // Act
    const result = await delegationService.getDelegation(userId, 'delegate-1')

    // Assert
    expect(DelegationFakeService.prototype.getDelegation).toHaveBeenCalledWith(
      userId,
      'delegate-1'
    )
    expect(result).toBe(expected)
  })

  test('createInvite() delegates to DelegationFakeService', async () => {
    // Arrange
    vi.spyOn(DelegationFakeService.prototype, 'createInvite').mockResolvedValue(
      undefined
    )
    const delegationService = new DelegationService(redis, makeConfig(true))
    const invite = { email: 'joe@example.gov.uk', cphs: ['12/345/6789'] }

    // Act
    await delegationService.createInvite(userId, invite)

    // Assert
    expect(DelegationFakeService.prototype.createInvite).toHaveBeenCalledWith(
      userId,
      invite
    )
  })

  test('updateDelegation() delegates to DelegationFakeService', async () => {
    // Arrange
    vi.spyOn(
      DelegationFakeService.prototype,
      'updateDelegation'
    ).mockResolvedValue(undefined)
    const delegationService = new DelegationService(redis, makeConfig(true))
    const updates = { active: true }

    // Act
    await delegationService.updateDelegation(userId, 'delegate-1', updates)

    // Assert
    expect(
      DelegationFakeService.prototype.updateDelegation
    ).toHaveBeenCalledWith(userId, 'delegate-1', updates)
  })

  test('deleteDelegation() delegates to DelegationFakeService', async () => {
    // Arrange
    vi.spyOn(
      DelegationFakeService.prototype,
      'deleteDelegation'
    ).mockResolvedValue(undefined)
    const delegationService = new DelegationService(redis, makeConfig(true))

    // Act
    await delegationService.deleteDelegation(userId, 'delegate-1')

    // Assert
    expect(
      DelegationFakeService.prototype.deleteDelegation
    ).toHaveBeenCalledWith(userId, 'delegate-1')
  })
})

describe('DelegationService (real)', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  test('getDelegations() delegates to service', async () => {
    // Arrange
    const expected = { page: 1, items: [], total_pages: 1, total_items: 0 }
    vi.spyOn(service, 'getDelegations').mockResolvedValue(expected)
    const delegationService = new DelegationService(redis, makeConfig(false))

    // Act
    const result = await delegationService.getDelegations(userId, 1)

    // Assert
    expect(service.getDelegations).toHaveBeenCalledWith(userId, 1)
    expect(result).toBe(expected)
  })

  test('getDelegation() delegates to service', async () => {
    // Arrange
    const expected = {
      id: 'delegate-1',
      email: 'joe@example.gov.uk',
      active: true
    }
    vi.spyOn(service, 'getDelegation').mockResolvedValue(expected)
    const delegationService = new DelegationService(redis, makeConfig(false))

    // Act
    const result = await delegationService.getDelegation(userId, 'delegate-1')

    // Assert
    expect(service.getDelegation).toHaveBeenCalledWith(userId, 'delegate-1')
    expect(result).toBe(expected)
  })

  test('createInvite() delegates to service', async () => {
    // Arrange
    vi.spyOn(service, 'createInvite').mockResolvedValue(undefined)
    const delegationService = new DelegationService(redis, makeConfig(false))
    const invite = { email: 'joe@example.gov.uk', cphs: ['12/345/6789'] }

    // Act
    await delegationService.createInvite(userId, invite)

    // Assert
    expect(service.createInvite).toHaveBeenCalledWith(userId, invite)
  })

  test('updateDelegation() delegates to service', async () => {
    // Arrange
    vi.spyOn(service, 'updateDelegation').mockResolvedValue(undefined)
    const delegationService = new DelegationService(redis, makeConfig(false))
    const updates = { active: true }

    // Act
    await delegationService.updateDelegation(userId, 'delegate-1', updates)

    // Assert
    expect(service.updateDelegation).toHaveBeenCalledWith(
      userId,
      'delegate-1',
      updates
    )
  })

  test('deleteDelegation() delegates to service', async () => {
    // Arrange
    vi.spyOn(service, 'deleteDelegation').mockResolvedValue(undefined)
    const delegationService = new DelegationService(redis, makeConfig(false))

    // Act
    await delegationService.deleteDelegation(userId, 'delegate-1')

    // Assert
    expect(service.deleteDelegation).toHaveBeenCalledWith(userId, 'delegate-1')
  })
})

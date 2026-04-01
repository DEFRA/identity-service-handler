import { describe, expect, test } from 'vitest'
import {
  getDelegations,
  getDelegation,
  createInvite,
  updateDelegation,
  deleteDelegation
} from './service.js'

describe('getDelegations()', () => {
  test('it throws not implemented', async () => {
    // Act
    let error
    try {
      await getDelegations('user-123')
    } catch (e) {
      error = e
    }

    // Assert
    expect(error?.message).toBe('Not implemented')
  })
})

describe('getDelegation()', () => {
  test('it throws not implemented', async () => {
    // Act
    let error
    try {
      await getDelegation('user-123', 'delegate-1')
    } catch (e) {
      error = e
    }

    // Assert
    expect(error?.message).toBe('Not implemented')
  })
})

describe('createInvite()', () => {
  test('it throws not implemented', async () => {
    // Act
    let error
    try {
      await createInvite('user-123', { email: 'joe@example.gov.uk' })
    } catch (e) {
      error = e
    }

    // Assert
    expect(error?.message).toBe('Not implemented')
  })
})

describe('updateDelegation()', () => {
  test('it throws not implemented', async () => {
    // Act
    let error
    try {
      await updateDelegation('user-123', 'delegate-1', { active: true })
    } catch (e) {
      error = e
    }

    // Assert
    expect(error?.message).toBe('Not implemented')
  })
})

describe('deleteDelegation()', () => {
  test('it throws not implemented', async () => {
    // Act
    let error
    try {
      await deleteDelegation('user-123', 'delegate-1')
    } catch (e) {
      error = e
    }

    // Assert
    expect(error?.message).toBe('Not implemented')
  })
})

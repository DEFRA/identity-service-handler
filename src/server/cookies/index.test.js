import hapi from '@hapi/hapi'
import { describe, expect, test } from 'vitest'
import { cookies } from './index.js'

describe('cookies plugin', () => {
  test('it registers a GET /cookies route with auth disabled', async () => {
    // Arrange
    const server = hapi.server()

    // Act
    let error
    try {
      await server.register(cookies)
    } catch (e) {
      error = e
    }

    // Assert
    expect(error).not.toBeDefined()
    const route = server
      .table()
      .find((r) => r.method === 'get' && r.path === '/cookies')
    expect(route).toBeDefined()
    expect(route.settings.auth).toBe(false)

    await server.stop({ timeout: 0 })
  })
})

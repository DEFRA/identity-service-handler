import path from 'node:path'
import hapi from '@hapi/hapi'
import Inert from '@hapi/inert'
import { config } from '../../../config/config.js'
import { serveStaticFiles } from './serve-static-files.js'
import { statusCodes } from '../constants/status-codes.js'

describe('serveStaticFiles', () => {
  let server
  beforeEach(() => {
    server = hapi.server({
      routes: {
        files: { relativeTo: path.resolve(config.get('root'), '.public') }
      }
    })
  })
  afterEach(async () => {
    await server.stop({ timeout: 0 })
  })
  test('it serves static assets', async () => {
    // Arrange
    await server.register([Inert, serveStaticFiles])
    await server.initialize()

    // Act
    const { statusCode } = await server.inject({
      method: 'GET',
      url: '/public/assets/images/govuk-crest.svg'
    })

    // Assert
    expect(statusCode).toBe(statusCodes.ok)
  })
})

import path from 'path'
import fs from 'node:fs/promises'
import { createLogger } from '../../common/helpers/logging/logger.js'

const logger = createLogger()

export class ServiceFake {
  constructor({ config, request }) {
    this.config = config
    this.applications = new Map()
  }

  async init() {
    const filePath = path.join(process.cwd(), 'src/data/applications.json')
    try {
      const stats = await fs.stat(filePath)
      if (stats.isFile()) {
        const content = await fs.readFile(filePath, 'utf-8')
        const applicationData = JSON.parse(content)
        for (const app of applicationData) {
          this.applications.set(app.client_id, app)
        }
      }
    } catch (error) {
      logger.warn(
        'Could not load application data from data folder:',
        error.message
      )
    }
  }

  async get(headers, id) {
    return this.applications.get(id)
  }
}

import fs from 'node:fs/promises'
import path from 'path'

export class ServiceFake {
  constructor({ config }) {
    this.config = config
    this.users = new Map()
  }

  async init() {
    const dataDir = path.join(process.cwd(), 'src/data/users')
    try {
      const files = await fs.readdir(dataDir)
      for (const file of files) {
        if (path.extname(file) !== '.json') {
          continue
        }
        const filePath = path.join(dataDir, file)
        const stats = await fs.stat(filePath)
        if (stats.isFile()) {
          const content = await fs.readFile(filePath, 'utf-8')
          const userData = JSON.parse(content)
          const fileNameWithoutExt = path.parse(file).name
          this.users.set(fileNameWithoutExt, userData)
        }
      }
    } catch (error) {
      console.warn('Could not load user data from data folder:', error.message)
    }
  }

  async getUserContext(headers, id) {
    return [...this.users.entries()].find((u) => u[1].sub === id)[1]
  }
}

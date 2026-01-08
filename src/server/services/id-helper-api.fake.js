import fs from 'fs/promises'

export function createFakeIdentityServiceHelperApiClient() {
  return {
    getUserRegistrations: (request, emailAddress) =>
      getUserRegistrations(request, emailAddress),
    getSupportedServices: (request) => getSupportedServices(request),
    getSupportedRoles: (request) => getSupportedRoles(request),
    addRoleToUser: (request, user, role) => addRoleToUser(request, user, role)
  }
}

async function getUserRegistrations(request, emailAddress) {
  const filePath = `./src/data/users/${emailAddress}.json`
  const userObject = {}

  try {
    await fs.access(filePath)
    const tmp = await fs.readFile(filePath, 'utf8')
    userObject.registeredRoles = JSON.parse(tmp)
  } catch (error) {
    if (error.code === 'ENOENT') {
      userObject.registeredRoles = {}
    } else {
      throw error
    }
  }

  return userObject
}

async function getSupportedServices(request) {
  const services = await fs.readFile(
    `./src/data/supportedServices.json`,
    'utf8'
  )

  if (!services) {
    throw new Error(`Service definition not found ./src/data`)
  }

  return JSON.parse(services)
}

async function getSupportedRoles(request) {
  const roles = await fs.readFile(`./src/data/roles.json`, 'utf8')

  if (!roles) {
    throw new Error(`Roles definition not found ./src/data`)
  }

  return JSON.parse(roles)
}

async function addRoleToUser(request, user, role) {
  return JSON.parse({
    confirmation: generateRequestId()
  })
}

const generateRequestId = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

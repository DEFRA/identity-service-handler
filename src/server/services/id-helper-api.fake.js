import { readFile } from 'fs/promises'

export function createFakeIdentityServiceHelperApiClient() {
  return {
    getUserRegistrations: (request, emailAddress) => getUserRegistrations(request, emailAddress),
    getSupportedServices: (request) => getSupportedServices(request),
    getSupportedRoles: (request) => getSupportedRoles(request)
  }
}

async function getUserRegistrations(request, emailAddress) {
  const result = await readFile(`./src/data/users/${emailAddress}.json`, 'utf8')

  if (!result) {
    throw new Error(`User '${emailAddress}' not found in ./src/data/users`)
  }

  const userObject = {}
  userObject.registeredRoles = JSON.parse(result)

  return userObject
}

async function getSupportedServices(request) {
  const services = await readFile(`./src/data/supportedServices.json`, 'utf8')

  if (!services) {
    throw new Error(`Service definition not found ./src/data`)
  }

  return JSON.parse(services)
}

async function getSupportedRoles(request) {
  const roles = await readFile(`./src/data/roles.json`, 'utf8')

  if (!roles) {
    throw new Error(`Roles definition not found ./src/data`)
  }

  return JSON.parse(roles)
}

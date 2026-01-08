export function createIdentityServiceHelperApiClient({ config }) {
  return {
    getUserRegistrations: (request, emailAddress) =>
      getUserRegistrations(config, request, emailAddress),
    getSupportedServices: (request) => getSupportedServices(config, request),
    getSupportedRoles: (request) => getSupportedRoles(config, request),
    addUserToRole: (request, user, role) =>
      addUserToRole(config, request, user, role)
  }
}

async function getUserRegistrations(config, request, emailAddress) {
  const apiUrl = `${request.protocol}://${config.baseUrl}/api/user/${encodeURIComponent(emailAddress)}`
  const apiResponse = await fetch(apiUrl, {
    headers: {
      'x-api-key': config.apiKey,
      cookie: request.headers.cookie || ''
    }
  })

  if (!apiResponse.ok) {
    throw new Error(`User API returned ${apiResponse.status}`)
  }

  return apiResponse.json()
}

async function getSupportedServices(config, request) {
  const apiUrl = `${request.protocol}://${config.baseUrl}/api/services}`
  const apiResponse = await fetch(apiUrl, {
    headers: {
      'x-api-key': config.apiKey,
      cookie: request.headers.cookie || ''
    }
  })

  if (!apiResponse.ok) {
    throw new Error(`User API returned ${apiResponse.status}`)
  }

  return apiResponse.json()
}

async function getSupportedRoles(config, request) {
  const apiUrl = `${request.protocol}://${config.baseUrl}/api/roles}`
  const apiResponse = await fetch(apiUrl, {
    headers: {
      'x-api-key': config.apiKey,
      cookie: request.headers.cookie || ''
    }
  })

  if (!apiResponse.ok) {
    throw new Error(`User API returned ${apiResponse.status}`)
  }

  return apiResponse.json()
}

async function addUserToRole(config, request, user, role) {
  const apiUrl = `${request.protocol}://${config.baseUrl}/api/role/${role}`
  const payload = { user: user.id }
  const apiResponse = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'x-api-key': config.apiKey,
      cookie: request.headers.cookie || ''
    },
    body: JSON.stringify(payload)
  })

  if (!apiResponse.ok) {
    throw new Error(`User API returned ${apiResponse.status}`)
  }

  return apiResponse.json()
}

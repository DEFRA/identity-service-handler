export function getOidcRoutes() {
  return [
    '/.well-known/openid-configuration',
    '/authorize',
    '/signout',
    '/jwks',
    '/token',
    '/request',
    '/userinfo'
  ]
}

export function getFormatedOidcRoutes() {
  return getOidcRoutes().map((r) => `${'GET'.padEnd(7)} ${r}`)
}

export function getOidcRoutes() {
  return ['/authorize', '/signout', '/jwks', '/token', '/request', '/userinfo']
}

export function getFormatedOidcRoutes() {
  return getOidcRoutes().map((r) => `${'GET'.padEnd(7)} ${r}`)
}

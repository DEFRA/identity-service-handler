import { OIDC_ROUTES } from './oidc-config.js'
const METHOD_COLUMN_LENGTH = 8
const formatRoute = (method, path) =>
  `\n${method.toUpperCase().padEnd(METHOD_COLUMN_LENGTH)}${path}`

export const logServerRoutes = (server) => {
  const routes = server
    .table()
    .filter((r) => !r.settings?.isInternal)
    .map((r) => formatRoute(r.method, r.path))
    .concat(OIDC_ROUTES.map((path) => formatRoute('GET', path)))
    .sort((a, b) => a.localeCompare(b))

  server.logger.info(`\nSupported routes:` + routes)
}

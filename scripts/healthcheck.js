import http from 'http'
import https from 'https'

const protocol = process.env.TLS_ENABLED === 'true' ? 'https' : 'http'
const base = process.argv[2] ?? `${protocol}://127.0.0.1:3000`
const url = new URL('/health', base)
const client = url.protocol === 'https:' ? https : http

client
  .get(url, { rejectUnauthorized: false }, (res) =>
    process.exit(res.statusCode < 400 ? 0 : 1)
  )
  .on('error', () => process.exit(1))

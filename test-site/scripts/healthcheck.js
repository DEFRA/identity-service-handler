import https from 'https'

const base = process.argv[2] ?? 'https://localhost:3005'
const url = new URL('/b2c/.well-known/openid-configuration', base)

https
  .get(url, { rejectUnauthorized: false }, (res) =>
    process.exit(res.statusCode < 400 ? 0 : 1)
  )
  .on('error', () => process.exit(1))

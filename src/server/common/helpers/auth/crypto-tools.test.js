import { describe, it } from 'node:test'
import assert from 'node:assert'
import { generateToken, verifyToken, hashToken } from './crypto-tools.js'
import { randomBytes } from 'node:crypto'

describe('crypto-tools', () => {
  describe('hash and compareHash', () => {
    test('should hash a string and verify it successfully', async () => {
      const plainText = 'myPassword123'
      const salt = randomBytes(16).toString('base64url')

      const hashed = hashToken(plainText, salt)
      const isMatch = verifyToken(plainText, salt, hashed)

      assert.strictEqual(isMatch, true)
    })

    test('should fail comparison with wrong password', async () => {
      const plainText = 'myPassword123'
      const wrongText = 'wrongPassword'
      const salt = randomBytes(16).toString('base64url')

      const hashed = hashToken(plainText, salt)
      const isMatch = verifyToken(wrongText, salt, hashed)

      assert.strictEqual(isMatch, false)
    })

    test('should handle empty strings', async () => {
      const plainText = ''
      const salt = randomBytes(16).toString('base64url')

      const hashed = hashToken(plainText, salt)
      const isMatch = verifyToken(plainText, salt, hashed)

      assert.strictEqual(isMatch, true)
    })

    test('should handle special characters', async () => {
      const plainText = '!@#$%^&*()_+-={}[]|:;"<>,.?/~`'
      const salt = randomBytes(16).toString('base64url')

      const hashed = hashToken(plainText, salt)
      const isMatch = verifyToken(plainText, salt, hashed)

      assert.strictEqual(isMatch, true)
    })
  })

  describe('generateToken', () => {
    test('should generate different tokens each time', () => {
      const tokenPair1 = generateToken('testTokenName')
      const tokenPair2 = generateToken('testTokenName')

      assert.notStrictEqual(tokenPair1, tokenPair2)
    })

    test('should generate token with default length when not specified', () => {
      const tokenPair = generateToken()

      assert.strictEqual(typeof tokenPair, 'object')
      assert.ok(tokenPair.hash.length > 0)
      assert.ok(tokenPair.salt.length > 0)
    })
  })
})

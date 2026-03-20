import { decodeSignoutRedirect } from './decode-signout-redirect.js'

describe('decodeSignoutRedirect()', () => {
  test('it returns / when value is undefined', () => {
    // Arrange
    const value = undefined

    // Act
    const result = decodeSignoutRedirect(value)

    // Assert
    expect(result).toBe('/')
  })

  test('it returns / when value is an empty string', () => {
    // Arrange
    const value = ''

    // Act
    const result = decodeSignoutRedirect(value)

    // Assert
    expect(result).toBe('/')
  })

  test('it returns / when value is whitespace only', () => {
    // Arrange
    const value = '   '

    // Act
    const result = decodeSignoutRedirect(value)

    // Assert
    expect(result).toBe('/')
  })

  test('it returns / when value is a malformed URI', () => {
    // Arrange
    const value = '%E0%A4%A'

    // Act
    const result = decodeSignoutRedirect(value)

    // Assert
    expect(result).toBe('/')
  })

  test('it decodes a valid encoded URI', () => {
    // Arrange
    const value = '/some%2Fpath'

    // Act
    const result = decodeSignoutRedirect(value)

    // Assert
    expect(result).toBe('/some/path')
  })

  test('it returns a plain path unchanged', () => {
    // Arrange
    const value = '/dashboard'

    // Act
    const result = decodeSignoutRedirect(value)

    // Assert
    expect(result).toBe('/dashboard')
  })
})

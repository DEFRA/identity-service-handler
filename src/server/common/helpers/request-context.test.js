import { AsyncLocalStorage } from 'node:async_hooks'
import { requestContext, get, set, clear, clearAll } from './request-context.js'

const mocks = {
  enterWith: vi.spyOn(AsyncLocalStorage.prototype, 'enterWith'),
  getStore: vi.spyOn(AsyncLocalStorage.prototype, 'getStore'),
  ext: vi.fn()
}

describe('requestContext', () => {
  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('plugin', () => {
    test('it registers an onRequest extension', () => {
      // Arrange
      const server = { ext: mocks.ext }

      // Act
      requestContext.register(server)

      // Assert
      expect(mocks.ext).toHaveBeenCalledWith('onRequest', expect.any(Function))
    })

    test('onRequest initialises an empty store and continues', () => {
      // Arrange
      const server = { ext: mocks.ext }
      requestContext.register(server)
      const [[, handler]] = mocks.ext.mock.calls
      const h = { continue: Symbol('continue') }

      // Act
      const result = handler({}, h)

      // Assert
      expect(mocks.enterWith).toHaveBeenCalledWith({})
      expect(result).toBe(h.continue)
    })
  })

  describe('get()', () => {
    test('it returns null when there is no store', () => {
      // Arrange
      mocks.getStore.mockReturnValue(undefined)

      // Act
      const result = get('foo')

      // Assert
      expect(result).toBeNull()
    })

    test('it returns null when the key is not in the store', () => {
      // Arrange
      mocks.getStore.mockReturnValue({})

      // Act
      const result = get('foo')

      // Assert
      expect(result).toBeNull()
    })

    test('it returns the value when the key is in the store', () => {
      // Arrange
      mocks.getStore.mockReturnValue({ foo: 'bar' })

      // Act
      const result = get('foo')

      // Assert
      expect(result).toBe('bar')
    })
  })

  describe('set()', () => {
    test('it throws when there is no store', () => {
      // Arrange
      mocks.getStore.mockReturnValue(undefined)
      let error

      // Act
      try {
        set('foo', 'bar')
      } catch (e) {
        error = e
      }

      // Assert
      expect(error).toBeInstanceOf(Error)
      expect(error?.message).toBe('No request context available')
    })

    test('it sets the value on the store', () => {
      // Arrange
      const store = {}
      mocks.getStore.mockReturnValue(store)

      // Act
      set('foo', 'bar')

      // Assert
      expect(store.foo).toBe('bar')
    })
  })

  describe('clear()', () => {
    test('it throws when there is no store', () => {
      // Arrange
      mocks.getStore.mockReturnValue(undefined)
      let error

      // Act
      try {
        clear('foo')
      } catch (e) {
        error = e
      }

      // Assert
      expect(error).toBeInstanceOf(Error)
      expect(error?.message).toBe('No request context available')
    })

    test('it removes the key from the store', () => {
      // Arrange
      const store = { foo: 'bar' }
      mocks.getStore.mockReturnValue(store)

      // Act
      clear('foo')

      // Assert
      expect(store).not.toHaveProperty('foo')
    })
  })

  describe('clearAll()', () => {
    test('it throws when there is no store', () => {
      // Arrange
      mocks.getStore.mockReturnValue(undefined)
      let error

      // Act
      try {
        clearAll()
      } catch (e) {
        error = e
      }

      // Assert
      expect(error).toBeInstanceOf(Error)
      expect(error?.message).toBe('No request context available')
    })

    test('it removes all keys from the store', () => {
      // Arrange
      const store = { foo: 'bar', baz: 'qux' }
      mocks.getStore.mockReturnValue(store)

      // Act
      clearAll()

      // Assert
      expect(store).toEqual({})
    })
  })
})

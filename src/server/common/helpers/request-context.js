import { AsyncLocalStorage } from 'node:async_hooks'

const storage = new AsyncLocalStorage()

export const requestContext = {
  name: 'requestContext',
  version: '1.0.0',
  register(server) {
    server.ext('onRequest', (request, h) => {
      storage.enterWith({})
      return h.continue
    })
  }
}

/**
 * Gets a value from the current request context.
 * Returns null if no context is available or the key is not set.
 *
 * @param {string} key
 * @returns {string | number | boolean | null}
 */
export const get = (key) => storage.getStore()?.[key] ?? null

/**
 * Sets a primitive value in the current request context.
 * Throws if called outside a request context.
 *
 * @param {string} key
 * @param {string | number | boolean | null} value
 */
export const set = (key, value) => {
  const store = storage.getStore()
  if (store === undefined) throw new Error('No request context available')
  store[key] = value
}

/**
 * Removes a key from the current request context.
 * Throws if called outside of a request context.
 *
 * @param {string} key
 */
export const clear = (key) => {
  const store = storage.getStore()
  if (store === undefined) throw new Error('No request context available')
  delete store[key]
}

/**
 * Removes all keys from the current request context.
 * Throws if called outside of a request context.
 */
export const clearAll = () => {
  const store = storage.getStore()
  if (store === undefined) throw new Error('No request context available')
  for (const key in store) {
    delete store[key]
  }
}

import { describe, expect, test } from 'vitest'
import Joi from 'joi'
import { cphsSchema, getCphValidationError } from './validate-cphs.js'

describe('cphsSchema', () => {
  test('it accepts a valid single CPH string', () => {
    const { error } = Joi.object({ cphs: cphsSchema }).validate({
      cphs: '12/345/6789'
    })
    expect(error).toBeUndefined()
  })

  test('it accepts an array of valid CPH strings', () => {
    const { error } = Joi.object({ cphs: cphsSchema }).validate({
      cphs: ['12/345/6789', '35/345/0005']
    })
    expect(error).toBeUndefined()
  })

  test('it rejects a string in the wrong format', () => {
    const { error } = Joi.object({ cphs: cphsSchema }).validate({
      cphs: 'invalid'
    })
    expect(error).toBeDefined()
  })

  test('it rejects an empty array', () => {
    const { error } = Joi.object({ cphs: cphsSchema }).validate({ cphs: [] })
    expect(error).toBeDefined()
  })

  test('it rejects when cphs is missing', () => {
    const { error } = Joi.object({ cphs: cphsSchema }).validate({})
    expect(error).toBeDefined()
  })
})

describe('getCphValidationError()', () => {
  test('it returns a format error when the pattern is invalid', () => {
    // Arrange
    const err = { details: [{ type: 'string.pattern.base' }] }

    // Act
    const result = getCphValidationError(err)

    // Assert
    expect(result).toBe(
      'Enter a County Parish Holding in the correct format, like 12/345/6789'
    )
  })

  test('it returns a format error when array.includes fails', () => {
    // Arrange
    const err = { details: [{ type: 'array.includes' }] }

    // Act
    const result = getCphValidationError(err)

    // Assert
    expect(result).toBe(
      'Enter a County Parish Holding in the correct format, like 12/345/6789'
    )
  })

  test('it returns a selection error for other validation failures', () => {
    // Arrange
    const err = { details: [{ type: 'any.required' }] }

    // Act
    const result = getCphValidationError(err)

    // Assert
    expect(result).toBe('Select at least one County Parish Holding')
  })

  test('it handles errors nested under data.details', () => {
    // Arrange
    const err = { data: { details: [{ type: 'string.pattern.base' }] } }

    // Act
    const result = getCphValidationError(err)

    // Assert
    expect(result).toBe(
      'Enter a County Parish Holding in the correct format, like 12/345/6789'
    )
  })
})

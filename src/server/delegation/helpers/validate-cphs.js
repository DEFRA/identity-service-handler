import Joi from 'joi'

export const CPH_REGEX = /^\d{2}\/\d{3}\/\d{4}$/

export const cphsSchema = Joi.alternatives()
  .try(
    Joi.string().pattern(CPH_REGEX),
    Joi.array().items(Joi.string().pattern(CPH_REGEX)).min(1)
  )
  .required()

/**
 * Returns a user-facing error message from a Joi validation error.
 * @param {import('joi').ValidationError} validationError
 * @returns {string}
 */
export function getCphValidationError(validationError) {
  const details =
    validationError?.details ?? validationError?.data?.details ?? []

  if (
    details.some(
      (detail) =>
        detail?.type === 'string.pattern.base' ||
        detail?.type === 'array.includes'
    )
  ) {
    return 'Enter a County Parish Holding in the correct format, like 12/345/6789'
  }

  return 'Select at least one County Parish Holding'
}

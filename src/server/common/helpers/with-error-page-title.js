export const withErrorPageTitle = (title, errors = {}) =>
  `${Object.keys(errors).length > 0 ? 'Error: ' : ''}${title}`

const minPageSize = 1
const maxPageSize = 50
const defaultPageSize = 5
const minPage = 1

export const buildPaginationSearchParams = (options = {}) => {
  const searchParams = new URLSearchParams()
  const pageSize = Math.min(
    maxPageSize,
    Math.max(
      minPageSize,
      !Number.isNaN(options.pageSize) && Number.isInteger(options.pageSize)
        ? options.pageSize
        : defaultPageSize
    )
  )
  const pageNumber =
    Number.isInteger(options.page) &&
    !Number.isNaN(options.page) &&
    options.page >= minPage
      ? options.page
      : 1

  searchParams.set('pageSize', pageSize)
  searchParams.set('pageNumber', pageNumber)

  return searchParams
}

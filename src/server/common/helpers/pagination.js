export const buildPagination = (page, totalPages, basePath) => {
  if (totalPages <= 1) {
    return null
  }

  const items = Array.from({ length: totalPages }, (_, index) => {
    const itemPage = index + 1
    return {
      number: itemPage,
      href: `${basePath}?page=${itemPage}`,
      current: itemPage === page
    }
  })

  return {
    items,
    previous:
      page > 1
        ? { labelText: 'Previous', href: `${basePath}?page=${page - 1}` }
        : null,
    next:
      page < totalPages
        ? { labelText: 'Next', href: `${basePath}?page=${page + 1}` }
        : null
  }
}

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

export const paginateList = (sortedList, options = {}) => {
  const { page = minPage, pageSize = defaultPageSize } = options
  const totalCount = sortedList.length
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  const start = (page - 1) * pageSize

  return {
    items: sortedList.slice(start, start + pageSize),
    total_count: totalCount,
    total_pages: totalPages,
    page_number: page,
    page_size: pageSize
  }
}

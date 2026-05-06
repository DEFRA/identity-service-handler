import { statusCodes } from '../../common/constants/status-codes.js'

const parsePage = (queryPage) => {
  if (queryPage === undefined) {
    return undefined
  }

  const page = Number.parseInt(queryPage, 10)
  return Number.isNaN(page) || page < 1 ? null : page
}

export const listController = (userService) => ({
  handler: async (request, h) => {
    const sub = request.auth?.credentials?.sub
    const requestedPage = parsePage(request.query?.page)

    if (requestedPage === null) {
      return h.redirect(request.path)
    }
    const [
      { assignments },
      {
        items: delegates,
        total_pages: totalPages,
        total_count: totalDelegatesCount,
        page_number: page
      }
    ] = await Promise.all([
      userService.getUserCphs(sub),
      userService.getUserDelegates(sub, { page: requestedPage ?? 1 })
    ])

    if (!assignments.length) {
      return h.response().code(statusCodes.notFound).takeover()
    }

    if (requestedPage !== undefined && requestedPage > totalPages) {
      return h.redirect(request.path)
    }

    const pagination = buildPagination(page, totalPages, request.path)

    return h.view('delegation/index', {
      pageTitle: 'Manage people who can act for you',
      heading: 'Manage people who can act for you',
      delegates,
      showingDelegatesCount: delegates.length,
      totalDelegatesCount,
      singleCph: assignments.length === 1,
      pagination
    })
  }
})

function buildPagination(page, totalPages, basePath) {
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
        ? {
            labelText: 'Previous',
            href: `${basePath}?page=${page - 1}`
          }
        : null,
    next:
      page < totalPages
        ? {
            labelText: 'Next',
            href: `${basePath}?page=${page + 1}`
          }
        : null
  }
}

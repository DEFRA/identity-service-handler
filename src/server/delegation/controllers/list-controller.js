import { getUserProfile } from '../../services/user.js'
import {
  buildPagination,
  paginateList
} from '../../common/helpers/pagination.js'
import { getDelegates } from '../../common/helpers/delegation.js'

const DELEGATION_FLASH = 'delegationFlash'

const parsePage = (queryPage) => {
  if (queryPage === undefined) {
    return undefined
  }

  const page = Number.parseInt(queryPage, 10)
  return Number.isNaN(page) || page < 1 ? null : page
}

const PAGE_SIZE = 5

export const listController = {
  handler: async (request, h) => {
    const sub = request.auth?.credentials?.sub
    const requestedPage = parsePage(request.query?.page)
    const profile = await getUserProfile(sub)
    const sortedDelegates = getDelegates(profile).sort((a, b) =>
      a.email.localeCompare(b.email)
    )

    if (requestedPage === null) {
      return h.redirect(request.path)
    }

    const {
      items: delegates,
      total_pages: totalPages,
      total_count: totalDelegatesCount,
      page_number: page
    } = paginateList(sortedDelegates, {
      page: requestedPage,
      pageSize: PAGE_SIZE
    })

    if (requestedPage !== undefined && requestedPage > totalPages) {
      return h.redirect(request.path)
    }

    const pagination = buildPagination(page, totalPages, request.path)

    const [delegationFlash] = request.yar.flash(DELEGATION_FLASH)

    return h.view('delegation/index', {
      pageTitle: 'Manage people who can act for you',
      heading: 'Manage people who can act for you',
      delegates,
      showingDelegatesCount: delegates.length,
      totalDelegatesCount,
      cphCount: profile.direct_assignments.length,
      pagination,
      flash: delegationFlash ?? null
    })
  }
}

import { getUserProfile } from '../../services/user.js'
import { getAcceptedInboundDelegations } from '../../common/helpers/delegation.js'
import {
  buildPagination,
  paginateList
} from '../../common/helpers/pagination.js'

const PAGE_SIZE = 10

const parsePage = (queryPage) => {
  if (queryPage === undefined) {
    return undefined
  }
  const page = Number.parseInt(queryPage, 10)
  return Number.isNaN(page) || page < 1 ? null : page
}

export const buildCphRows = (profile) => {
  const ownRows = profile.direct_assignments.map((assignment) => ({
    cphNumber: assignment.county_parish_holding_number,
    ownerLabel: 'You',
    delegationId: null
  }))

  const delegatedRows = getAcceptedInboundDelegations(profile).map(
    (delegation) => ({
      cphNumber: delegation.county_parish_holding_number,
      ownerLabel: delegation.delegating_user_name,
      delegationId: delegation.id
    })
  )

  return [...ownRows, ...delegatedRows].sort((a, b) =>
    a.cphNumber.localeCompare(b.cphNumber)
  )
}

export const listController = {
  handler: async (request, h) => {
    const sub = request.auth?.credentials?.sub
    const requestedPage = parsePage(request.query?.page)

    if (requestedPage === null) {
      return h.redirect(request.path)
    }

    const profile = await getUserProfile(sub)
    const allRows = buildCphRows(profile)

    const {
      items: cphRows,
      total_pages: totalPages,
      total_count: totalCount,
      page_number: page
    } = paginateList(allRows, { page: requestedPage, pageSize: PAGE_SIZE })

    if (requestedPage !== undefined && requestedPage > totalPages) {
      return h.redirect(request.path)
    }

    const pagination = buildPagination(page, totalPages, request.path)
    const [flash] = request.yar.flash('cphsFlash')

    return h.view('cphs/index', {
      pageTitle: 'County Parish Holdings you can manage',
      heading: 'County Parish Holdings you can manage',
      cphRows,
      showingCount: cphRows.length,
      totalCount,
      page,
      pagination,
      flash: flash ?? null
    })
  }
}

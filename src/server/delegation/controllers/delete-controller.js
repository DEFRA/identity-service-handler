function viewModel(delegate) {
  const isActive = delegate.active

  return {
    pageTitle: isActive ? 'Delete delegate' : 'Revoke invite',
    heading: isActive
      ? 'Are you sure you want to delete this delegate?'
      : 'Are you sure you want to revoke this invite?',
    delegate
  }
}

export const deleteController = (delegationService) => ({
  handler: async (request, h) => {
    const sub = request.auth?.credentials?.sub
    const { delegateId } = request.params
    const delegate = await delegationService.getDelegation(sub, delegateId)

    if (!delegate) {
      return h.redirect('/delegation')
    }

    return h.view('delegation/delete', viewModel(delegate))
  }
})

export const deleteSubmitController = (delegationService) => ({
  handler: async (request, h) => {
    const sub = request.auth?.credentials?.sub
    const { delegateId } = request.params

    await delegationService.deleteDelegation(sub, delegateId)

    return h.redirect('/delegation')
  }
})

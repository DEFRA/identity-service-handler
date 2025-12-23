export const homeController = {
  async handler(_request, h) {
    const user = _request.yar.get('user') || null

    if (!user) {
      _request.yar.reset()
      return h
        .view('error/index', {
          title: 'There is a problem',
          heading: 'No JWT token submitted',
          message: 'You need to come from Your Defra account to continue.',
          linkHref: '/your-defra-account',
          linkText: 'Go to Your Defra account'
        })
        .code(500)
    }

    return h.redirect('/dashboard')
  }
}

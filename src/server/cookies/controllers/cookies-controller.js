export const cookiesController = {
  handler: (_request, h) => {
    return h.view('cookies/index', {
      pageTitle: 'Cookies'
    })
  }
}

import { UserService } from '../../../services/user/UserService.js'

export const contextController = {
  handler: (request, h) => {
    const userService = new UserService()

    return h.response(userService.getUserContext(request.user)).code(200)
  }
}

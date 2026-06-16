import { buildNavigation } from './build-navigation.js'

function mockRequest(options) {
  return { ...options }
}

describe('#buildNavigation', () => {
  test('Should provide expected navigation details', () => {
    expect(
      buildNavigation(mockRequest({ path: '/non-existent-path' }))
    ).toEqual([
      {
        current: false,
        text: 'Home',
        href: '/'
      },
      {
        current: false,
        text: 'About',
        href: '/about'
      },
      {
        current: false,
        text: 'Account',
        href: '/account'
      }
    ])
  })

  test('Should provide expected highlighted navigation details for home', () => {
    expect(buildNavigation(mockRequest({ path: '/' }))).toEqual([
      {
        current: true,
        text: 'Home',
        href: '/'
      },
      {
        current: false,
        text: 'About',
        href: '/about'
      },
      {
        current: false,
        text: 'Account',
        href: '/account'
      }
    ])
  })

  test('Should highlight account nav item when on /account', () => {
    expect(buildNavigation(mockRequest({ path: '/account' }))).toEqual([
      {
        current: false,
        text: 'Home',
        href: '/'
      },
      {
        current: false,
        text: 'About',
        href: '/about'
      },
      {
        current: true,
        text: 'Account',
        href: '/account'
      }
    ])
  })
})

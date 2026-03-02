import { beforeEach, describe, expect, test, vi } from 'vitest'
import { DelegationDraftService } from '../../services/delegation/DelegationDraftService.js'
import {
  speciesController,
  speciesSubmitController
} from './species-controller.js'

const mocks = {
  view: vi.fn(),
  redirect: vi.fn(),
  code: vi.fn(),
  takeover: vi.fn()
}

describe('speciesController()', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.clearAllMocks()
  })

  test('it renders the species page with stored selections', async () => {
    // Arrange
    const request = {}
    vi.spyOn(DelegationDraftService.prototype, 'getSpecies').mockReturnValue([
      'cattle'
    ])
    mocks.view.mockReturnValue('view-response')
    const h = { view: mocks.view }

    // Act
    const result = await speciesController().handler(request, h)

    // Assert
    expect(mocks.view).toHaveBeenCalledWith(
      'delegation/species',
      expect.objectContaining({
        pageTitle: 'Select the species you want to delegate',
        heading: 'Select the species you want to delegate',
        formValues: {
          species: ['cattle']
        },
        errors: {}
      })
    )
    expect(result).toBe('view-response')
  })
})

describe('speciesSubmitController()', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.clearAllMocks()
  })

  test('it stores species selections and redirects on valid payload', async () => {
    // Arrange
    const setSpecies = vi
      .spyOn(DelegationDraftService.prototype, 'setSpecies')
      .mockReturnValue(undefined)
    const request = {
      payload: {
        species: ['sheep', 'cattle']
      }
    }
    mocks.redirect.mockReturnValue('redirect-response')
    const h = { redirect: mocks.redirect }

    // Act
    const result = await speciesSubmitController().handler(request, h)

    // Assert
    expect(setSpecies).toHaveBeenCalledWith(['sheep', 'cattle'])
    expect(mocks.redirect).toHaveBeenCalledWith('/delegation/create/cphs')
    expect(result).toBe('redirect-response')
  })

  test('it re-renders species page from failAction when nothing is selected', async () => {
    // Arrange
    const request = {
      payload: {}
    }
    mocks.takeover.mockReturnValue('takeover-response')
    mocks.code.mockReturnValue({ takeover: mocks.takeover })
    mocks.view.mockReturnValue({ code: mocks.code })
    const h = { view: mocks.view }

    // Act
    const result = await speciesSubmitController().options.validate.failAction(
      request,
      h
    )

    // Assert
    expect(mocks.view).toHaveBeenCalledWith(
      'delegation/species',
      expect.objectContaining({
        pageTitle: 'Error: Select the species you want to delegate',
        formValues: {
          species: []
        },
        errors: {
          species: 'Select at least one species'
        }
      })
    )
    expect(mocks.code).toHaveBeenCalledWith(400)
    expect(mocks.takeover).toHaveBeenCalledTimes(1)
    expect(result).toBe('takeover-response')
  })
})

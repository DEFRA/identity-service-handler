// @vitest-environment jsdom

import { describe, test, expect, beforeAll } from 'vitest'
import { readdirSync } from 'node:fs'
import nunjucks from 'nunjucks'
import axe from 'axe-core'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import * as filters from '../config/nunjucks/filters/filters.js'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(dirname, '../..')

let env

beforeAll(() => {
  env = new nunjucks.Environment(
    [
      new nunjucks.FileSystemLoader(
        path.join(root, 'node_modules/govuk-frontend/dist/')
      ),
      new nunjucks.FileSystemLoader(path.join(dirname, 'common/templates')),
      new nunjucks.FileSystemLoader(path.join(dirname, 'common/components')),
      new nunjucks.FileSystemLoader(dirname)
    ],
    { autoescape: true, trimBlocks: true, lstripBlocks: true }
  )

  Object.entries(filters).forEach(([name, filter]) => {
    env.addFilter(name, filter)
  })

  axe.configure({ allowedOrigins: ['<unsafe_all_origins>'] })
})

const baseContext = {
  serviceName: 'Test Service',
  serviceUrl: '/',
  breadcrumbs: [],
  navigation: [],
  pageTitle: 'Test page',
  linkText: 'Continue',
  linkHref: '/',
  getAssetPath: (asset) => `/${asset}`
}

async function checkTemplate(template) {
  const html = env.render(template, baseContext)
  document.open()
  document.write(html)
  document.close()
  const { violations } = await axe.run(document, {
    rules: { 'color-contrast': { enabled: false } }
  })
  return violations.filter(
    (v) => v.impact === 'serious' || v.impact === 'critical'
  )
}

function findTemplates(dir, base = dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const rel = path.relative(base, path.join(dir, entry.name))
    if (entry.isDirectory()) {
      return entry.name === 'common'
        ? []
        : findTemplates(path.join(dir, entry.name), base)
    }
    return entry.name.endsWith('.njk') ? [rel] : []
  })
}

const templates = findTemplates(dirname)

describe('accessibility', () => {
  test.each(templates)('%s', async (template) => {
    // Arrange/Act
    const violations = await checkTemplate(template)

    // Assert
    expect(violations).toEqual([])
  })
})

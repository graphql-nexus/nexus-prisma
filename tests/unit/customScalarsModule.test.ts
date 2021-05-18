import NexusPrismaScalars, * as NexusPrismaScalarsNS from '../../src/entrypoints/scalars'
import { assertBuildPresent } from '../__helpers__/helpers'

assertBuildPresent()

it('scalars can be accessed via namespace import', () => {
  expect(Object.keys(NexusPrismaScalarsNS)).toMatchInlineSnapshot(`
    Array [
      "DateTime",
      "Json",
      "default",
    ]
  `)
})

it('scalars can be accessed via a default import', () => {
  expect(Object.keys(NexusPrismaScalars)).toMatchInlineSnapshot(`
    Array [
      "DateTime",
      "Json",
    ]
  `)
})

import * as NexusPrismaScalarsNS from '../../src/entrypoints/scalars'
import { assertBuildPresent } from '../__helpers__/helpers'

assertBuildPresent()

it('scalars can be accessed via namespace import', () => {
  expect(Object.keys(NexusPrismaScalarsNS)).toMatchInlineSnapshot(`
Array [
  "BigInt",
  "Bytes",
  "DateTime",
  "Decimal",
  "Json",
  "default",
]
`)
})

import endent from 'endent'
import { generate } from './__helpers__'

it('generates static TS code given DMMF', async () => {
  const runtime = await generate(endent`
    model M1 {
      f10 String @id
      f11 Int
      f12 Float
      f13 Boolean
      f14 Decimal
      f15 BigInt
      f16 DateTime
      f17 Json
      f18 Bytes
    }
  `)

  expect(runtime).toMatchSnapshot()
})

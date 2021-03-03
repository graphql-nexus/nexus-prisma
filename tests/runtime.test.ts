import * as PrismaSDK from '@prisma/sdk'
import endent from 'endent'
import { generateRuntime } from '../src/generator/generate'

it('generates static TS code given DMMF', async () => {
  const schema = endent`
    datasource db {
      provider = "postgresql"
      url      = env("DB_URL")
    }

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
  `

  const dmmf = await PrismaSDK.getDMMF({
    datamodel: schema,
  })

  const source = generateRuntime(dmmf)

  expect(source).toMatchSnapshot()
})

import dedent from 'dindist'
import { objectType } from 'nexus'

import * as NexusPrismaScalars from '../../../src/entrypoints/scalars'
import { testGraphqlSchema } from '../../__helpers__/testers'

testGraphqlSchema({
  description: 'When a JSON field is defined in the Prisma schema it can be projected into the GraphQL API',
  database: dedent`
    model Foo {
      id   String @id
      json Json
    }
  `,
  api({ Foo }) {
    return [
      NexusPrismaScalars.BigInt,
      NexusPrismaScalars.Bytes,
      NexusPrismaScalars.DateTime,
      NexusPrismaScalars.Json,
      objectType({
        name: Foo.$name,
        definition(t) {
          t.field(Foo.json)
        },
      }),
    ]
  },
})

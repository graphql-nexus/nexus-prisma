import { objectType } from 'nexus'
import dedent from 'ts-dedent'
import NexusPrismaScalars from '../../../scalars'
import { testGraphqlSchema } from '../../__helpers__/testers'

testGraphqlSchema({
  description: 'When a JSON field is defined in the Prisma schema it can be projected into the GraphQL API',
  datasourceSchema: dedent`
    model Foo {
      id   String @id
      json Json
    }
  `,
  apiSchema({ Foo }) {
    return [
      NexusPrismaScalars.DateTime,
      NexusPrismaScalars.Json,
      objectType({
        name: Foo.$name,
        definition(t) {
          t.field(Foo.json.$name, Foo.json)
        },
      }),
    ]
  },
})

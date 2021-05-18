import endent from 'endent'
import gql from 'graphql-tag'
import { list, objectType, queryType } from 'nexus'
import NexusPrismaScalars from '../../scalars'
import { testIntegration } from '../__helpers__/testers'

testIntegration({
  skip: true, // integration test currently only works against SQLite which doesn't support JSON
  description: 'When a JSON field is defined in the Prisma schema it can be projected into the GraphQL API',
  datasourceSchema: endent`
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
      queryType({
        definition(t) {
          t.field('foos', {
            type: list(Foo.name),
            resolve(_, __, ctx) {
              return ctx.prisma.foo.findMany()
            },
          })
        },
      }),
    ]
  },
  async datasourceSeed(prisma) {
    await prisma.foo.create({
      data: {
        id: 'foo1',
        json: JSON.stringify({ babar: true }),
      },
    })
  },
  apiClientQuery: gql`
    query {
      foos {
        id
        json
      }
    }
  `,
})

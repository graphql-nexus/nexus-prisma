import endent from 'endent'
import { objectType } from 'nexus'
import NexusPrismaScalars from '../../scalars'
import { generateGraphqlSchemaSDL } from '../__helpers__'

it('When a JSON field is defined in the Prisma schema it can be projected into the GraphQL API', async () => {
  const graphqlSchema = await generateGraphqlSchemaSDL({
    prismaSchema: endent`
      model Foo {
        id   String @id
        json Json
      }
    `,
    nexus(configurations) {
      return [
        NexusPrismaScalars.DateTime,
        NexusPrismaScalars.Json,
        objectType({
          name: configurations.Foo.$name,
          definition(t) {
            t.field(configurations.Foo.json.$name, configurations.Foo.json)
          },
        }),
      ]
    },
  })

  expect(graphqlSchema).toMatchSnapshot()
})

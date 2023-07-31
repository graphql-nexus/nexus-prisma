import { printSchema } from 'graphql'
import { makeSchema, objectType, queryType } from 'nexus'
import { Foo } from './generated/nexus-prisma'

const schema = makeSchema({
  types: [
    objectType({
      name: Foo.$name,
      definition(t) {
        t.field(Foo.id)
      },
    }),
    queryType({
      definition(t) {
        t.list.field('foos', {
          type: 'Foo',
          resolve(_, __, ctx) {
            return ctx.prisma.foo.findMany()
          },
        })
      },
    }),
  ],
})

console.log(printSchema(schema))

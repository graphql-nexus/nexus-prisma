import { printSchema } from 'graphql'
import { makeSchema, objectType, queryType } from 'nexus'
import NexusPrisma from './nexus-prisma.cjs'
const { Foo } = NexusPrisma

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

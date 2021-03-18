import endent from 'endent'
import { enumType } from 'nexus'
import { generateSchema } from '../__helpers__'

it('When an enum is defined in the Prisma schema it can be projected into the GraphQL API', async () => {
  const schema = await generateSchema({
    prismaSchema: endent`
      enum Foo {
        a
      }
    `,
    nexus(configurations) {
      return [enumType(configurations.Foo)]
    },
  })

  expect(schema).toMatchSnapshot()
})

it('When an enum with multiple members is defined in the Prisma schema it and all its members can be projected into the GraphQL API', async () => {
  const schema = await generateSchema({
    prismaSchema: endent`
      enum Foo {
        a
        b
        c
      }
    `,
    nexus(configurations) {
      return [enumType(configurations.Foo)]
    },
  })

  expect(schema).toMatchSnapshot()
})

it('When an enum is defined with documentation in the Prisma schema it can be projected into the GraphQL API with that documentation', async () => {
  const schema = await generateSchema({
    prismaSchema: endent`
      /// Some documentation
      enum Foo {
        a
      }
    `,
    nexus(configurations) {
      return [enumType(configurations.Foo)]
    },
  })

  expect(schema).toMatchSnapshot()
})

import endent from 'endent'
import { enumType } from 'nexus'
import { testGraphqlSchema } from '../__helpers__'

testGraphqlSchema({
  description: 'When an enum is defined in the Prisma schema it can be projected into the GraphQL API',
  datasourceSchema: endent`
    enum Foo {
      a
    }
  `,
  apiSchema({ Foo }) {
    return [enumType(Foo)]
  },
})

testGraphqlSchema({
  description:
    'When an enum with multiple members is defined in the Prisma schema it and all its members can be projected into the GraphQL API',
  datasourceSchema: endent`
    enum Foo {
      a
      b
      c
    }
  `,
  apiSchema({ Foo }) {
    return [enumType(Foo)]
  },
})

testGraphqlSchema({
  description:
    'When an enum is defined with documentation in the Prisma schema it can be projected into the GraphQL API with that documentation',
  datasourceSchema: endent`
    /// Some documentation
    enum Foo {
      a
    }
  `,
  apiSchema({ Foo }) {
    return [enumType(Foo)]
  },
})

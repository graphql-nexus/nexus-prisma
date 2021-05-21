import dedent from 'dindist'
import { enumType } from 'nexus'
import { testGraphqlSchema } from '../../__helpers__/testers'

testGraphqlSchema({
  description: 'When an enum is defined in the Prisma schema it can be projected into the GraphQL API',
  datasourceSchema: dedent`
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
  datasourceSchema: dedent`
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
  datasourceSchema: dedent`
    /// Some documentation
    enum Foo {
      a
    }
  `,
  apiSchema({ Foo }) {
    return [enumType(Foo)]
  },
})

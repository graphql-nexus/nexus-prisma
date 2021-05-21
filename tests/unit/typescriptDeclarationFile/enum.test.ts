import dedent from 'dindist'
import { testGeneratedModules } from '../../__helpers__/testers'

testGeneratedModules({
  description: 'An enum maps to a Nexus enum type definition',
  databaseSchema: dedent`
    enum Foo {
      a
    }
  `,
})

testGeneratedModules({
  description: 'When prisma enum has documentation then it is used for JSDoc and GraphQL enum description',
  databaseSchema: dedent`
    /// Some documentation
    enum Foo {
      a
    }
  `,
})

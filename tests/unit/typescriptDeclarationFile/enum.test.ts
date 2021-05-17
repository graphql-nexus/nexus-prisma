import endent from 'endent'
import { testGeneratedModules } from '../../__helpers__'

testGeneratedModules({
  description: 'An enum maps to a Nexus enum type definition',
  databaseSchema: endent`
    enum Foo {
      a
    }
  `,
})

testGeneratedModules({
  description: 'When prisma enum has documentation then it is used for JSDoc and GraphQL enum description',
  databaseSchema: endent`
    /// Some documentation
    enum Foo {
      a
    }
  `,
})

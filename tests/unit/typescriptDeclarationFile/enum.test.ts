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

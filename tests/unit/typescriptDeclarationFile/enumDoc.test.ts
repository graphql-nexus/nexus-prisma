import dedent from 'ts-dedent'
import { testGeneratedModules } from '../../__helpers__/testers'

testGeneratedModules({
  description:
    'When an enum has no documentation comment, then it gets the default JSDoc and its description field is null',
  databaseSchema: dedent`
    enum Foo {
      a
    }
  `,
})

testGeneratedModules({
  description:
    'When an enum has a documentation comment, then it is used for the JSDoc of that enum and its $description field',
  databaseSchema: dedent`
    /// Some documentation
    enum Foo {
      a
    }
  `,
})

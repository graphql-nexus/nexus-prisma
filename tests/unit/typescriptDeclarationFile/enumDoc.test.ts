import endent from 'endent'
import { testGeneratedModules } from '../../__helpers__'

testGeneratedModules({
  description:
    'When an enum has no documentation comment, then it gets the default JSDoc and its description field is null',
  databaseSchema: endent`
    enum Foo {
      a
    }
  `,
})

testGeneratedModules({
  description:
    'When an enum has a documentation comment, then it is used for the JSDoc of that enum and its $description field',
  databaseSchema: endent`
    /// Some documentation
    enum Foo {
      a
    }
  `,
})

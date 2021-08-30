import dedent from 'dindist'
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

testGeneratedModules({
  description:
    'When an enum has a documentation comment across lines, then they are joined and then used for the JSDoc of that field and its $description field',
  databaseSchema: `
    /// Some documentation
    /// on
    ///
    /// multiple
    /// lines
    ///
    enum SomeEnum {
      /// Some documentation
      /// on
      ///
      /// multiple
      /// lines
      ///
      a
    }
  `,
})

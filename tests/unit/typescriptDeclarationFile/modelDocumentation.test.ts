import { testGeneratedModules } from '../../__helpers__/testers'

testGeneratedModules({
  description:
    'When a model has no documentation comment, then it gets the default JSDoc and its description field is null',
  databaseSchema: `
    model SomeModel {
      id String @id
    }
  `,
})

testGeneratedModules({
  description:
    'When a model field has no documentation comment, then it gets the default JSDoc and its description field is null',
  databaseSchema: `
    model SomeModel {
      id String @id
    }
  `,
})

testGeneratedModules({
  description:
    'When a model or model field has no documentation comment, and `jsdocPropagationDefault` is set to "none", then it does not get any default JSDoc and its description field is null',
  settings: {
    jsdocPropagationDefault: 'none',
  },
  databaseSchema: `
    model SomeModel {
      id String @id
    }
  `,
})

testGeneratedModules({
  description:
    'When a model has a documentation comment, then it is used for the JSDoc of that model and its $description field',
  databaseSchema: `
    /// Some documentation
    model SomeModel {
      id String @id
    }
  `,
})

testGeneratedModules({
  description:
    'When a model field has a documentation comment, then it is used for the JSDoc of that field and its $description field',
  databaseSchema: `
    model SomeModel {
      /// Some documentation
      id String @id
    }
  `,
})

testGeneratedModules({
  description:
    'When a model field has a documentation comment across lines, then they are joined and then used for the JSDoc of that field and its $description field',
  databaseSchema: `
    /// Some documentation
    /// on
    ///
    /// multiple
    /// lines
    ///
    model SomeModel {
      /// Some documentation
      /// on
      ///
      /// multiple
      /// lines
      ///
      id  String  @id
    }
  `,
})

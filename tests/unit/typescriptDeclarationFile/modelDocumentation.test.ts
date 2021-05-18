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

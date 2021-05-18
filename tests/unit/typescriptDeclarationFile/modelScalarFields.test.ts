import { testGeneratedModules } from '../../__helpers__/testers'

testGeneratedModules({
  description: 'A model field with type String, attribute @id, maps to GraphQL ID scalar',
  databaseSchema: `
    model SomeModel {
      id String @id
    }
  `,
})

testGeneratedModules({
  description: 'A model field with type Int, attribute @id, maps to GraphQL Int scalar',
  databaseSchema: `
    model SomeModel {
      id Int @id
    }
  `,
})

testGeneratedModules({
  description: 'A model field with type Int maps to GraphQL Int scalar',
  databaseSchema: `
    model SomeModel {
      id  String @id
      foo Int
    }
  `,
})

testGeneratedModules({
  description: 'A model field with type Float maps to GraphQL Float scalar',
  databaseSchema: `
    model SomeModel {
      id  String @id
      foo Float
    }
  `,
})

testGeneratedModules({
  description: 'A model field with type Boolean maps to GraphQL Boolean scalar',
  databaseSchema: `
    model SomeModel {
      id  String @id
      foo Boolean
    }
  `,
})

testGeneratedModules({
  description: 'A model field with type Json maps to GraphQL Json custom scalar',
  databaseSchema: `
    model SomeModel {
      id  String @id
      foo Json
    }
  `,
})

testGeneratedModules({
  description: 'A model field with type DateTime maps to GraphQL DateTime custom scalar',
  databaseSchema: `
    model SomeModel {
      id  String @id
      foo DateTime
    }
  `,
})

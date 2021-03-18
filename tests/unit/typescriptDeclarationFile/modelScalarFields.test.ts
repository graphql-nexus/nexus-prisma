import { generateModules } from '../../__helpers__'

it('A model field with type String, attribute @id, maps to GraphQL ID scalar', async () => {
  const { indexdts } = await generateModules(`
    model SomeModel {
      id String @id
    }
  `)

  expect(indexdts).toMatchSnapshot()
})

it('A model field with type Int, attribute @id, maps to GraphQL ID scalar', async () => {
  const { indexdts } = await generateModules(`
    model SomeModel {
      id Int @id
    }
  `)

  expect(indexdts).toMatchSnapshot()
})

it('A model field with type Int maps to GraphQL Int scalar', async () => {
  const { indexdts } = await generateModules(`
    model SomeModel {
      id  String @id
      foo Int
    }
  `)

  expect(indexdts).toMatchSnapshot()
})

it('A model field with type Float maps to GraphQL Float scalar', async () => {
  const { indexdts } = await generateModules(`
    model SomeModel {
      id  String @id
      foo Float
    }
  `)

  expect(indexdts).toMatchSnapshot()
})

it('A model field with type Boolean maps to GraphQL Boolean scalar', async () => {
  const { indexdts } = await generateModules(`
    model SomeModel {
      id  String @id
      foo Boolean
    }
  `)

  expect(indexdts).toMatchSnapshot()
})

it('A model field with type Json maps to GraphQL Json custom scalar', async () => {
  const { indexdts } = await generateModules(`
    model SomeModel {
      id  String @id
      foo Json
    }
  `)

  expect(indexdts).toMatchSnapshot()
})

it('A model field with type DateTime maps to GraphQL DateTime custom scalar', async () => {
  const { indexdts } = await generateModules(`
    model SomeModel {
      id  String @id
      foo DateTime
    }
  `)

  expect(indexdts).toMatchSnapshot()
})

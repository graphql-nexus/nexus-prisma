import { generateModules } from '../../__helpers__'

it('When a model has no documentation comment, then it gets the default JSDoc and its description field is null', async () => {
  const { indexdts } = await generateModules(`
    model SomeModel {
      id String @id
    }
  `)

  expect(indexdts).toMatchSnapshot()
})

it('When a model field has no documentation comment, then it gets the default JSDoc and its description field is null', async () => {
  const { indexdts } = await generateModules(`
    model SomeModel {
      id String @id
    }
  `)

  expect(indexdts).toMatchSnapshot()
})

it('When a model has a documentation comment, then it is used for the JSDoc of that model and its $description field', async () => {
  const { indexdts } = await generateModules(`
    /// Some documentation
    model SomeModel {
      id String @id
    }
  `)

  expect(indexdts).toMatchSnapshot()
})

it('When a model field has a documentation comment, then it is used for the JSDoc of that field and its $description field', async () => {
  const { indexdts } = await generateModules(`
    model SomeModel {
      /// Some documentation
      id String @id
    }
  `)

  expect(indexdts).toMatchSnapshot()
})

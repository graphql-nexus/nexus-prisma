import { generateModules } from '../../__helpers__'

it('When an enum has no documentation comment, then it gets the default JSDoc and its description field is null', async () => {
  const { indexdts } = await generateModules(`
    enum Foo {
      a
    }
  `)

  expect(indexdts).toMatchSnapshot()
})

it('When an enum has a documentation comment, then it is used for the JSDoc of that enum and its $description field', async () => {
  const { indexdts } = await generateModules(`
    /// Some documentation
    enum Foo {
      a
    }
  `)

  expect(indexdts).toMatchSnapshot()
})

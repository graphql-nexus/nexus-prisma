import { generateModules } from '../../__helpers__'

it('An enum maps to a Nexus enum type definition', async () => {
  const { indexdts } = await generateModules(`
    enum Foo {
      a
    }
  `)

  expect(indexdts).toMatchSnapshot()
})

it('When prisma enum has documentation then it is used for JSDoc and GraphQL enum description', async () => {
  const { indexdts } = await generateModules(`
    /// Some documentation
    enum Foo {
      a
    }
  `)

  expect(indexdts).toMatchSnapshot()
})

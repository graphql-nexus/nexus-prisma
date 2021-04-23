import { generateModules } from '../../__helpers__'

it('A model relation field projects a default resolve function', async () => {
  const { indexdts } = await generateModules(`
  model User {
    id    Int     @id
    posts Post[]
  }
  
  model Post {
    id        Int      @id
    author    User?    @relation(fields: [authorId], references: [id])
    authorId  Int?
  }
  `)

  expect(indexdts).toMatchSnapshot()
})

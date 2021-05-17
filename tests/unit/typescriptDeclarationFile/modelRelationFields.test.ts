import { testGeneratedModules } from '../../__helpers__'

testGeneratedModules({
  description: 'A model relation field projects a default resolve function',
  databaseSchema: `
    model User {
      id    Int     @id
      posts Post[]
    }
    
    model Post {
      id        Int      @id
      author    User?    @relation(fields: [authorId], references: [id])
      authorId  Int?
    }
  `,
})

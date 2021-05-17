import endent from 'endent'
import { gql } from 'graphql-tag'
import { objectType, queryType } from 'nexus'
import { testIntegration } from '../__helpers__'

testIntegration({
  description: 'can project user-to-posts relationship',
  datasourceSchema: endent`
    model User {
      id         String    @id
      posts      Post[]
    }
    model Post {
      id        String  @id
      author    User?   @relation(fields: [authorId], references: [id])
      authorId  String
    }
  `,
  datasourceSeed(prisma) {
    return prisma.user.create({
      data: {
        id: 'user1',
        posts: {
          create: [{ id: 'post1' }, { id: 'post2' }],
        },
      },
    })
  },
  apiSchema({ User, Post }) {
    return [
      queryType({
        definition(t) {
          t.list.field('users', {
            type: 'User',
            resolve(_, __, ctx) {
              return ctx.prisma.user.findMany()
            },
          })
        },
      }),
      objectType({
        name: User.$name,
        definition(t) {
          t.field(User.id.name, User.id)
          t.field(User.posts.name, User.posts)
        },
      }),
      objectType({
        name: Post.$name,
        definition(t) {
          t.field(Post.id.name, Post.id)
        },
      }),
    ]
  },
  apiClientQuery: gql`
    query {
      users {
        id
        posts {
          id
        }
      }
    }
  `,
})

import gql from 'graphql-tag'
import { objectType, queryType } from 'nexus'
import { IntegrationTestSpec } from './__helpers__/testers'

export namespace Specs {
  export const relation1ToNReverse: IntegrationTestSpec = {
    description:
      'can project user-to-posts relationship in reverse (access use via post author field). If Post.author is NOT optional than it is NOT nullable in the GraphQL API.',
    datasourceSchema: `
    model User {
      id         String    @id
      posts      Post[]
    }
    model Post {
      id        String  @id
      author    User    @relation(fields: [authorId], references: [id])
      authorId  String
    }
  `,
    apiSchema(nexusPrisma) {
      const { User, Post } = nexusPrisma

      return [
        queryType({
          definition(t) {
            t.nonNull.list.nonNull.field('posts', {
              type: Post.$name,
              resolve(_, __, ctx) {
                return ctx.prisma.post.findMany()
              },
            })
          },
        }),
        objectType({
          name: User.$name,
          definition(t) {
            t.field(User.id)
          },
        }),
        objectType({
          name: Post.$name,
          definition(t) {
            t.field(Post.id)
            t.field(Post.author)
          },
        }),
      ]
    },
    async datasourceSeed(prisma) {
      await prisma.user.create({
        data: {
          id: 'user1',
          posts: {
            create: [{ id: 'post1' }, { id: 'post2' }],
          },
        },
      })
    },
    apiClientQuery: gql`
      query {
        posts {
          id
          author {
            id
          }
        }
      }
    `,
  }

  export const relation1ToNReverseAndOptional: IntegrationTestSpec = {
    description:
      'can project user-to-posts relationship in reverse (access use via post author field). If Post.author IS optional than it IS nullable in the GraphQL API.',
    datasourceSchema: `
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
    apiSchema(nexusPrisma) {
      const { User, Post } = nexusPrisma

      return [
        queryType({
          definition(t) {
            t.nonNull.list.nonNull.field('posts', {
              type: Post.$name,
              resolve(_, __, ctx) {
                return ctx.prisma.post.findMany()
              },
            })
          },
        }),
        objectType({
          name: User.$name,
          definition(t) {
            t.field(User.id)
          },
        }),
        objectType({
          name: Post.$name,
          definition(t) {
            t.field(Post.id)
            t.field(Post.author)
          },
        }),
      ]
    },
    async datasourceSeed(prisma) {
      await prisma.user.create({
        data: {
          id: 'user1',
          posts: {
            create: [{ id: 'post1' }, { id: 'post2' }],
          },
        },
      })
    },
    apiClientQuery: gql`
      query {
        posts {
          id
          author {
            id
          }
        }
      }
    `,
  }
}

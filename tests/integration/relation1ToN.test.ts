import { gql } from 'graphql-tag'
import { objectType, queryType } from 'nexus'
import { Specs } from '../specs'
import { testIntegration } from '../__helpers__/testers'

testIntegration({
  description: 'can project user-to-posts relationship',
  database: `
    model User {
      id     String  @id
      posts  Post[]
    }
    model Post {
      id        String  @id
      author    User?   @relation(fields: [authorId], references: [id])
      authorId  String
    }
  `,
  api({ User, Post }) {
    return [
      queryType({
        definition(t) {
          t.nonNull.list.nonNull.field('users', {
            type: User.$name,
            resolve(_, __, ctx) {
              return ctx.prisma.user.findMany()
            },
          })
        },
      }),
      objectType({
        name: User.$name,
        definition(t) {
          t.field(User.id)
          t.field(User.posts)
        },
      }),
      objectType({
        name: Post.$name,
        definition(t) {
          t.field(Post.id)
        },
      }),
    ]
  },
  async setup(prisma) {
    await prisma.user.create({
      data: {
        id: 'user1',
        posts: {
          create: [{ id: 'post1' }, { id: 'post2' }],
        },
      },
    })
  },
  client: gql`
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

testIntegration(Specs.relation1ToNReverseAndOptional)

testIntegration(Specs.relation1ToNReverse)

testIntegration({
  description: 'can project user-to-posts relation where user has composite ID',
  database: `
    model User {
      id1    String
      id2    String
      posts  Post[]
      @@id(fields: [id1, id2])
    }
    model Post {
      id         String  @id
      author     User?   @relation(fields: [authorId1, authorId2], references: [id1, id2])
      authorId1  String
      authorId2  String
    }
  `,
  api({ User, Post }) {
    return [
      queryType({
        definition(t) {
          t.nonNull.list.nonNull.field('users', {
            type: User.$name,
            resolve(_, __, ctx) {
              return ctx.prisma.user.findMany()
            },
          })
        },
      }),
      objectType({
        name: User.$name,
        definition(t) {
          t.field(User.id1)
          t.field(User.posts)
        },
      }),
      objectType({
        name: Post.$name,
        definition(t) {
          t.field(Post.id)
        },
      }),
    ]
  },
  async setup(prisma) {
    await prisma.user.create({
      data: {
        id1: 'user1',
        id2: 'user1',
        posts: {
          create: [{ id: 'post1' }],
        },
      },
    })
  },
  client: gql`
    query {
      users {
        id1
        posts {
          id
        }
      }
    }
  `,
})

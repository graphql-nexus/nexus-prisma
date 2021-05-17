import { gql } from 'graphql-tag'
import { objectType, queryType } from 'nexus'
import { testIntegration } from '../__helpers__'

testIntegration({
  description: 'can project user-to-posts relationship',
  datasourceSchema: `
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
  apiSchema({ User, Post }) {
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
      users {
        id
        posts {
          id
        }
      }
    }
  `,
})

testIntegration({
  description: 'can project user-to-posts relationship in reverse (access use via post author field)',
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
  apiSchema({ User, Post }) {
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
          t.field(User.id.name, User.id)
        },
      }),
      objectType({
        name: Post.$name,
        definition(t) {
          t.field(Post.id.name, Post.id)
          t.field(Post.author.name, Post.author)
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
})

testIntegration({
  description: 'can project user-to-posts relation where user has composite ID',
  datasourceSchema: `
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
  apiSchema({ User, Post }) {
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
          t.field(User.id1.name, User.id1)
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
  async datasourceSeed(prisma) {
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
  apiClientQuery: gql`
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

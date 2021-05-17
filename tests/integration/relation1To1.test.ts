import { gql } from 'graphql-tag'
import { nonNull, objectType, queryType } from 'nexus'
import { testIntegration } from '../__helpers__'

testIntegration({
  description: 'can project user-to-profile relationship',
  datasourceSchema: `
    model User {
      id         String    @id
      profile    Profile   @relation(fields: [profileId], references: [id])
      profileId  String
    }
    model Profile {
      id      String  @id
      user    User?
    }
  `,
  apiSchema({ User, Profile }) {
    return [
      queryType({
        definition(t) {
          t.nonNull.list.nonNull.field('users', {
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
          t.field(User.profile.name, User.profile)
        },
      }),
      objectType({
        name: Profile.$name,
        definition(t) {
          t.field(Profile.id.name, Profile.id)
        },
      }),
    ]
  },
  async datasourceSeed(prisma) {
    await prisma.user.create({
      data: {
        id: 'user1',
        profile: {
          create: {
            id: 'profile1',
          },
        },
      },
    })
  },
  apiClientQuery: gql`
    query {
      users {
        id
        profile {
          id
        }
      }
    }
  `,
})

// https://github.com/prisma/nexus-prisma/issues/34
testIntegration({
  description:
    'can project relationship in opposite direction of where @relation is defined, but the field will be nullable',
  datasourceSchema: `
    model User {
      id         String    @id
      profile    Profile   @relation(fields: [profileId], references: [id])
      profileId  String
    }
    model Profile {
      id      String  @id
      user    User?
    }
  `,
  apiSchema({ User, Profile }) {
    return [
      queryType({
        definition(t) {
          t.nonNull.list.nonNull.field('users', {
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
          t.field(User.profile.name, User.profile)
        },
      }),
      objectType({
        name: Profile.$name,
        definition(t) {
          t.field(Profile.id.name, Profile.id)
          t.field(Profile.user.name, Profile.user)
        },
      }),
    ]
  },
  async datasourceSeed(prisma) {
    await prisma.user.create({
      data: {
        id: 'user1',
        profile: {
          create: {
            id: 'profile1',
          },
        },
      },
    })
  },
  apiClientQuery: gql`
    query {
      users {
        id
        profile {
          id
          user {
            id
          }
        }
      }
    }
  `,
})

testIntegration({
  description:
    'Nullable on Without-Relation-Scalar Side limitation can be worked around by wrapping type in an explicit nonNull',
  datasourceSchema: `
      model User {
        id         String    @id
        profile    Profile   @relation(fields: [profileId], references: [id])
        profileId  String
      }
      model Profile {
        id      String  @id
        user    User?
      }
    `,
  apiSchema({ User, Profile }) {
    return [
      queryType({
        definition(t) {
          t.nonNull.list.nonNull.field('users', {
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
          t.field(User.profile.name, User.profile)
        },
      }),
      objectType({
        name: Profile.$name,
        definition(t) {
          t.field(Profile.id.name, Profile.id)
          t.field(Profile.user.name, {
            ...Profile.user,
            type: nonNull(Profile.user.type),
          })
        },
      }),
    ]
  },
  async datasourceSeed(prisma) {
    await prisma.user.create({
      data: {
        id: 'user1',
        profile: {
          create: {
            id: 'profile1',
          },
        },
      },
    })
  },
  apiClientQuery: gql`
    query {
      users {
        id
        profile {
          id
          user {
            id
          }
        }
      }
    }
  `,
})

testIntegration({
  description: 'Can project User-to-Profile where Profile is using composite ID',
  datasourceSchema: `
      model User {
        id          String    @id
        profile     Profile   @relation(fields: [profileId1, profileId2], references: [id1, id2])
        profileId1  String
        profileId2  String
      }
      model Profile {
        id1   String
        id2   String
        user  User?
        @@id(fields: [id1, id2])
      }
    `,
  apiSchema({ User, Profile }) {
    return [
      queryType({
        definition(t) {
          t.nonNull.list.nonNull.field('users', {
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
          t.field(User.profile.name, User.profile)
        },
      }),
      objectType({
        name: Profile.$name,
        definition(t) {
          t.field(Profile.id1.name, Profile.id1)
          t.field(Profile.user.name, {
            ...Profile.user,
            type: nonNull(Profile.user.type),
          })
        },
      }),
    ]
  },
  async datasourceSeed(prisma) {
    await prisma.user.create({
      data: {
        id: 'user1',
        profile: {
          create: {
            id1: 'profile1',
            id2: 'profile1',
          },
        },
      },
    })
  },
  apiClientQuery: gql`
    query {
      users {
        id
        profile {
          id1
          user {
            id
          }
        }
      }
    }
  `,
})

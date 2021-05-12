import endent from 'endent'
import { gql } from 'graphql-tag'
import { nonNull, objectType, queryType } from 'nexus'
import { integrationTest } from '../__helpers__'

it('can project user-to-profile relationship', async () => {
  const result = await integrationTest({
    name: `relation1To1-1`,
    datasourceSchema: endent`
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
    datasourceSeed(prisma) {
      return prisma.user.create({
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
    apiSchema({ User, Profile }) {
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

  expect(result).toMatchSnapshot()
})

// https://github.com/prisma/nexus-prisma/issues/34
it('can project relationship in opposite direction of where @relation is defined, but the field will be nullable', async () => {
  const result = await integrationTest({
    name: `relation1To1-2`,
    datasourceSchema: endent`
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
    datasourceSeed(prisma) {
      return prisma.user.create({
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
    apiSchema({ User, Profile }) {
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

  expect(result).toMatchSnapshot()
})

it('Nullable on Without-Relation-Scalar Side limitation can be worked around by wrapping type in an explicit nonNull', async () => {
  const result = await integrationTest({
    name: `relation1To1-3`,
    datasourceSchema: endent`
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
    datasourceSeed(prisma) {
      return prisma.user.create({
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
    apiSchema({ User, Profile }) {
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

  expect(result).toMatchSnapshot()
})

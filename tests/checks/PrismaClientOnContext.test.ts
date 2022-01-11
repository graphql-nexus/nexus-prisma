import gql from 'graphql-tag'
import { noop } from 'lodash'
import { objectType, queryType } from 'nexus'
import { testIntegration } from '../__helpers__/testers'

testIntegration({
  description: 'error thrown when instanceof check and duck typing fails',
  datasourceSchema: `
    model User {
      id        String   @id
			profile   Profile? @relation(fields: [profileId], references: [id])
			profileId String
    }
		model Profile {
      id    String  @id
			user  User
		}
  `,
  apiSchema({ User, Profile }) {
    return [
      queryType({
        definition(t) {
          t.nonNull.list.nonNull.field('users', {
            type: 'User',
            resolve(_, __, ctx) {
              return [{ id: '1' }]
            },
          })
        },
      }),
      objectType({
        name: User.$name,
        definition(t) {
          t.field(User.id)
          t.field(User.profile)
        },
      }),
      objectType({
        name: Profile.$name,
        definition(t) {
          t.field(Profile.id)
        },
      }),
    ]
  },
  prismaClient(prismaClientPackage) {
    return 'should be prisma client instance but is not' as any
  },
  apiClientQuery: gql`
    query {
      users {
        profile {
          id
        }
      }
    }
  `,
})

testIntegration({
  description: 'warning emitted when instanceof check but duck typing succeeds',
  datasourceSchema: `
    model User {
      id        String   @id
			profile   Profile? @relation(fields: [profileId], references: [id])
			profileId String
    }
		model Profile {
      id    String  @id
			user  User
		}
  `,
  apiSchema({ User, Profile }) {
    return [
      queryType({
        definition(t) {
          t.nonNull.list.nonNull.field('users', {
            type: 'User',
            resolve(_, __, ctx) {
              return [{ id: '1' }]
            },
          })
        },
      }),
      objectType({
        name: User.$name,
        definition(t) {
          t.field(User.id)
          t.field(User.profile)
        },
      }),
      objectType({
        name: Profile.$name,
        definition(t) {
          t.field(Profile.id)
        },
      }),
    ]
  },
  prismaClient(prismaClientPackage) {
    // Break the instanceof check but duck typing will succeed.
    const prisma = new prismaClientPackage.PrismaClient()
    return { ...prisma }
  },
  apiClientQuery: gql`
    query {
      users {
        profile {
          id
        }
      }
    }
  `,
})

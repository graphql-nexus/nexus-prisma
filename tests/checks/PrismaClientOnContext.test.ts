import gql from 'graphql-tag'
import { objectType, queryType } from 'nexus'
import { testIntegration, testIntegrationPartial } from '../__helpers__/testers'

const base = testIntegrationPartial({
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
  description: 'error thrown when both instanceof check and duck typing fails',
  prismaClient(prismaClientPackage) {
    return 'should be prisma client instance but is not' as any
  },
  ...base,
})

testIntegration({
  description: 'warning emitted when instanceof check fails but duck typing succeeds',
  prismaClient(prismaClientPackage) {
    // Break the instanceof check but duck typing will succeed.
    const prisma = new prismaClientPackage.PrismaClient()
    return { ...prisma }
  },
  ...base,
})

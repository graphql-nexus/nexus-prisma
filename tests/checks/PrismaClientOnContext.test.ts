import gql from 'graphql-tag'
import { objectType, queryType } from 'nexus'
import { testIntegration, TestIntegrationParams, testIntegrationPartial } from '../__helpers__/testers'

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

/**
 * Break the instanceof check but duck typing will succeed.
 */
const instanceOfFailingPrismaClient: TestIntegrationParams['prismaClient'] = (prismaClientPackage) => {
  const prisma = new prismaClientPackage.PrismaClient()
  return { ...prisma }
}

/**
 * Some value that won't even pass Prisma Client duck typing check.
 */
const duckTypeFailingPrismaClient: TestIntegrationParams['prismaClient'] = (prismaClientPackage) => {
  return 'should be prisma client instance but is not' as any
}

testIntegration({
  description: 'error thrown when both instanceof check and duck typing fails',
  prismaClient: duckTypeFailingPrismaClient,
  ...base,
})

testIntegration({
  description: 'warning emitted when instanceof check fails but duck typing succeeds',
  prismaClient: instanceOfFailingPrismaClient,
  ...base,
})

testIntegration({
  description:
    'when check is disabled then warning NOT emitted when instanceof check fails but duck typing succeeds',
  prismaClient: instanceOfFailingPrismaClient,
  runtimeConfig(settings) {
    settings.change({
      checks: {
        PrismaClientOnContext: {
          enabled: false,
        },
      },
    })
  },
  ...base,
})

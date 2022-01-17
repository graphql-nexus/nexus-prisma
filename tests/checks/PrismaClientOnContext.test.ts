import gql from 'graphql-tag'
import { objectType, queryType } from 'nexus'
import { testIntegration, TestIntegrationParams, testIntegrationPartial } from '../__helpers__/testers'

const base = testIntegrationPartial({
  database: `
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
  api({ User, Profile }) {
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
  client: gql`
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
const prismaClientWhereInstanceofStrategyWillFail: TestIntegrationParams['prismaClient'] = (
  prismaClientPackage
) => {
  const prisma = new prismaClientPackage.PrismaClient()
  return { ...prisma }
}

/**
 * Some value that won't even pass Prisma Client duck typing check.
 */
const prismaClientWhereDuckTypingStrategyWillFail: TestIntegrationParams['prismaClient'] = (
  prismaClientPackage
) => {
  return 'should be prisma client instance but is not' as any
}

testIntegration({
  description: 'error thrown when both instanceof check and duck typing fails',
  prismaClient: prismaClientWhereDuckTypingStrategyWillFail,
  ...base,
})

testIntegration({
  description: 'warning emitted when instanceof check fails but duck typing succeeds',
  prismaClient: prismaClientWhereInstanceofStrategyWillFail,
  ...base,
})

testIntegration({
  description:
    'when check is disabled then warning NOT emitted when instanceof check fails OR duck typing fails',
  prismaClient: prismaClientWhereDuckTypingStrategyWillFail,
  nexusPrismaRuntimeConfig(settings) {
    settings.change({
      checks: {
        PrismaClientOnContext: false,
      },
    })
  },
  ...base,
})

testIntegration({
  description:
    'when check instanceof strategy is disabled then warning NOT emitted when instanceof check fails but duck typing succeeds',
  prismaClient: prismaClientWhereInstanceofStrategyWillFail,
  nexusPrismaRuntimeConfig(settings) {
    settings.change({
      checks: {
        PrismaClientOnContext: {
          warnWhenInstanceofStrategyFails: false,
        },
      },
    })
  },
  ...base,
})

testIntegration({
  description: `If prisma client import fails then the check cannot perform its instanceof strategy and thus throws an error`,
  nexusPrismaGentimeConfig(settings) {
    settings.change({
      prismaClientImportId: 'does-not-exist',
    })
  },
  ...base,
})

testIntegration({
  description: `If prisma client import succeeds but what is imported is not a valid prisma client then the check cannot perform its instanceof strategy and thus throws an error`,
  nexusPrismaGentimeConfig(settings) {
    settings.change({
      prismaClientImportId: __filename,
    })
  },
  ...base,
})

import gql from 'graphql-tag'
import { objectType, queryType } from 'nexus'
import { testIntegration, TestIntegrationParams, testIntegrationPartial } from '../__helpers__/testers'

const base = testIntegrationPartial({
  database: `
    model User {
      id        String   @id
			profile   Profile @relation(fields: [profileId], references: [id])
			profileId String   @unique
    }
		model Profile {
      id    String  @id
			user  User?    @relation
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
  async setup(prisma) {
    await prisma.user.create({
      data: {
        id: '1',
        profile: {
          create: {
            id: '100',
          },
        },
      },
    })
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

describe('instanceOf_duckType_fallback strategy:', () => {
  testIntegration({
    description: 'error thrown when both instanceof check and duck typing fails',
    prismaClient: prismaClientWhereDuckTypingStrategyWillFail,
    ...base,
  })
  testIntegration({
    description: 'warning emitted when instanceof check fails but duck typing succeeds',
    prismaClient: prismaClientWhereInstanceofStrategyWillFail,
    ...base,
    // The emitted error contains a path that isn't stable across the CI/CI matrix. Needs to be processed.
    expect(result) {
      if (result.logs[0]) {
        result.logs[0] = result.logs[0]!.replace(/(.*imported from).*(is not the.*)/, '$1 <dynamic_path> $2')
      }
      console.log(JSON.stringify(result.logs))
      expect(result.logs).toMatchSnapshot(`logs`)
      expect(result.graphqlSchemaSDL).toMatchSnapshot(`graphqlSchemaSDL`)
      expect(result.graphqlOperationExecutionResult).toMatchSnapshot(`graphqlOperationExecutionResult`)
    },
  })
})

describe('instanceOf strategy:', () => {
  testIntegration({
    description: 'passes if client is a real instance of prisma client',
    nexusPrismaRuntimeConfig(settings) {
      settings.change({
        checks: {
          PrismaClientOnContext: {
            strategy: 'instanceOf',
          },
        },
      })
    },
    ...base,
  })

  testIntegration({
    description: 'throws an error if client is NOT a real instance of prisma client',
    prismaClient: prismaClientWhereInstanceofStrategyWillFail,
    nexusPrismaRuntimeConfig(settings) {
      settings.change({
        checks: {
          PrismaClientOnContext: {
            strategy: 'instanceOf',
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
    nexusPrismaRuntimeConfig(settings) {
      settings.change({
        checks: {
          PrismaClientOnContext: {
            strategy: 'instanceOf',
          },
        },
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
    nexusPrismaRuntimeConfig(settings) {
      settings.change({
        checks: {
          PrismaClientOnContext: {
            strategy: 'instanceOf',
          },
        },
      })
    },
    ...base,
  })
})

describe('duckType strategy:', () => {
  testIntegration({
    description: 'passes if client looks like a valid prisma client instance',
    prismaClient: prismaClientWhereInstanceofStrategyWillFail,
    nexusPrismaRuntimeConfig(settings) {
      settings.change({
        checks: {
          PrismaClientOnContext: {
            strategy: 'duckType',
          },
        },
      })
    },
    ...base,
  })
  testIntegration({
    description:
      'does not matter if prisma client is not importable (and therefore nor if what would be imported is not a valid prisma client instance)',
    prismaClient: prismaClientWhereInstanceofStrategyWillFail,
    nexusPrismaGentimeConfig(settings) {
      settings.change({
        prismaClientImportId: 'does-not-exist',
      })
    },
    nexusPrismaRuntimeConfig(settings) {
      settings.change({
        checks: {
          PrismaClientOnContext: {
            strategy: 'duckType',
          },
        },
      })
    },
    ...base,
  })
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
  // Node.js 14.x vs 16.x have differing error messages so we do not snapshot in order to have CI matrix pass without issue
  expect(result) {
    expect(result.graphqlOperationExecutionResult.errors?.[0]?.message).toMatch(/Cannot read.*findUnique.*/)
  },
  ...base,
})

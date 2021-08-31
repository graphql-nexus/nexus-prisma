import gql from 'graphql-tag'
import { objectType, queryType } from 'nexus'
import { testIntegration } from '../__helpers__/testers'

testIntegration({
  description: 'ignores global rejectOnNotFound Prisma Client settings',
  datasourceSchema: `
    model User {
      id         String    @id
      profile    Profile?  @relation(fields: [profileId], references: [id])
      profileId  String?
    }
    model Profile {
      id    String  @id
			user  User?
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
  setupPrismaClient(prismaClientPackage) {
    // This global setting should have no effect on Nexus Prisma
    return new prismaClientPackage.PrismaClient({
      rejectOnNotFound: true,
    })
  },
  async setup(prisma) {
    await prisma.user.create({
      data: {
        id: 'user1',
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

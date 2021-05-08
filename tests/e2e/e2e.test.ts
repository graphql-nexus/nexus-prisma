import endent from 'endent'
import * as Execa from 'execa'
import { dump } from 'nexus/dist/utils'
import stripAnsi from 'strip-ansi'
import { assertBuildPresent, createPrismaSchema, setupTestProject, TestProject } from '../__helpers__'

interface FileSpec {
  filePath: string
  content: string
}

interface ProjectResult {
  runFirstBuild: Execa.ExecaSyncReturnValue<string>
  runReflectPrisma: Execa.ExecaSyncReturnValue<string>
  runReflectNexus: Execa.ExecaSyncReturnValue<string>
  runSecondBuildStdout: Execa.ExecaSyncReturnValue<string>
  graphqlSchema?: string
  typegen?: string
}

function runTestProject(testProject: TestProject): ProjectResult {
  const commandConfig: Execa.SyncOptions = {
    reject: false,
    cwd: testProject.fs.cwd(),
  }
  const runFirstBuild = Execa.commandSync(`npm run build`, commandConfig)
  const runReflectPrisma = Execa.commandSync(`npm run reflect:prisma`, commandConfig)
  const runReflectNexus = Execa.commandSync(`npm run reflect:nexus`, commandConfig)
  const runSecondBuildStdout = Execa.commandSync(`npm run build`, commandConfig)
  const graphqlSchema = testProject.fs.read('schema.graphql')
  const typegen = testProject.fs.read('typegen.ts')

  return {
    runFirstBuild,
    runReflectPrisma,
    runReflectNexus,
    runSecondBuildStdout,
    graphqlSchema,
    typegen,
  }
}

function setupTestNexusPrismaProject(): TestProject {
  const testProject = setupTestProject({
    packageJson: {
      license: 'MIT',
      scripts: {
        reflect: 'yarn -s reflect:prisma && yarn -s reflect:nexus',
        'reflect:prisma': 'prisma generate',
        // peer dependency check will fail since we're using yalc, e.g.:
        // " ... nexus-prisma@0.0.0-dripip+c2653557 does not officially support @prisma/client@2.22.1 ... "
        'reflect:nexus': 'cross-env REFLECTION=true ts-node --transpile-only main',
        build: 'tsc',
        'dev:server': 'yarn ts-node-dev --transpile-only server',
        'db:migrate': 'prisma db push --force-reset && ts-node prisma/seed',
        'db:up': 'docker-compose up -d && sleep 3 && yarn db:migrate',
      },
      dependencies: {
        dotenv: '^9.0.0',
        'apollo-server': '^2.24.0',
        'cross-env': '^7.0.1',
        '@prisma/client': '^2.18.0',
        '@types/node': '^14.14.32',
        graphql: '^15.5.0',
        nexus: '^1.0.0',
        prisma: '^2.18.0',
        'ts-node': '^9.1.1',
        'ts-node-dev': '^1.1.6',
        typescript: '^4.2.3',
      },
    },
  })

  if (!testProject.info.isReusing) {
    Execa.commandSync(`yalc publish --no-scripts`)
    testProject.run(`yalc add nexus-prisma`)
    testProject.run(`npm install`)
    testProject.run(`yarn -s db:up`)
  }

  return testProject
}

let testProject: TestProject

beforeAll(() => {
  assertBuildPresent()
  testProject = setupTestNexusPrismaProject()
})

it('When bundled custom scalars are used the project type checks and generates expected GraphQL schema', () => {
  const files: FileSpec[] = [
    {
      filePath: `prisma/schema.prisma`,
      content: createPrismaSchema(endent`
        model M1 {
          id                String   @id
          someJsonField     Json
          someDateTimeField DateTime
        }

        enum E1 {
          a
          b
          c
        }
      `),
    },
    {
      filePath: `prisma/seed.ts`,
      content: endent/*ts*/ `
        import { PrismaClient } from '@prisma/client'

        main()

        async function main() {
          const prisma = new PrismaClient()

          await prisma.$executeRaw('TRUNCATE "Foo", "Bar"')
          await prisma.foo.create({
            data: {
              id: 'foo1',
              someDateTimeField: new Date(),
              someJsonField: JSON.stringify({}),
              bar: {
                create: {
                  id: 'bar1',
                },
              },
            },
          })

          await prisma.$disconnect()
        }
      `,
    },
    {
      filePath: `schema.ts`,
      content: endent/*ts*/ `
        import { makeSchema, objectType, enumType } from 'nexus'
        import { M1, E1 } from 'nexus-prisma'
        import * as customScalars from 'nexus-prisma/scalars'
        import * as Path from 'path'
        
        const types = [
          customScalars,
          enumType(E1),
          objectType({
            name: M1.$name,
            definition(t) {
              t.field('e1', {
                type: 'E1'
              })
              t.json('JsonManually')
              t.dateTime('DateTimeManually')
              t.field(M1.someJsonField.name, M1.someJsonField)
              t.field(M1.someDateTimeField.name, M1.someDateTimeField)
            },
          }),
        ]
        
        makeSchema({
          types,
          shouldGenerateArtifacts: true,
          shouldExitAfterGenerateArtifacts: true,
          outputs: {
            schema: true,
            typegen: Path.join(__dirname, 'typegen.ts'),
          },
          sourceTypes: {
            modules: [{ module: '.prisma/client', alias: 'PrismaClient' }],
          },
        })

        // wait for output generation
        setTimeout(() => {}, 1000)
      `,
    },
    {
      filePath: `context.ts`,
      content: endent/*ts*/ `

        const prisma = new PrismaClient()
        
        export type Context = {
          prisma: PrismaClient
        }
        
        export function context() {
          return {
            prisma,
          }
        }
      `,
    },
    {
      filePath: `server.ts`,
      content: endent/*ts*/ `
        require('dotenv').config()


        const apollo = new ApolloServer({
          schema,
          context,
        })

        apollo.listen(4000, () => {
          console.log(\`🚀 GraphQL API ready at http://localhost:4000/graphql\`)
        })
      `,
    },
    {
      filePath: `.env`,
      content: endent`
        DB_URL="postgres://prisma:prisma@localhost:5700"
        NO_PEER_DEPENDENCY_CHECK="true"
      `,
    },
    {
      filePath: 'docker-compose.yml',
      content: endent/*yml*/ `
        version: '3.8'
        services:
          # postgres://prisma:prisma@localhost:5700
          postgres:
            image: postgres:10
            container_name: nexus-prisma-test
            restart: always
            environment:
              - POSTGRES_USER=prisma
              - POSTGRES_PASSWORD=prisma
            ports:
              - '5700:5432'
      `,
    },
  ]

  files.forEach((fileSpec) => testProject.fs.write(fileSpec.filePath, fileSpec.content))

  // todo api server & database & seed that allows for testing that prisma runtime usage works

  // uncomment this to see dir (helpful to go there yourself and manually debug)
  console.log(testProject.fs.cwd())

  const results = runTestProject(testProject)

  // uncomment this to see the raw results (helpful for debugging)
  dump(results)

  /**
   * Sanity checks around buildtime
   */

  expect(results.runFirstBuild.exitCode).toBe(2)

  expect(stripAnsi(results.runFirstBuild.stdout)).toMatch(
    /.*error TS2305: Module '"nexus-prisma"' has no exported member 'M1'.*/
  )
  expect(stripAnsi(results.runFirstBuild.stdout)).toMatch(
    /.*error TS2339: Property 'json' does not exist on type 'ObjectDefinitionBlock<any>'.*/
  )
  expect(stripAnsi(results.runFirstBuild.stdout)).toMatch(
    /.*error TS2339: Property 'dateTime' does not exist on type 'ObjectDefinitionBlock<any>'.*/
  )

  expect(results.runReflectPrisma.exitCode).toBe(0)

  expect(stripAnsi(results.runReflectPrisma.stdout)).toMatch(/.*Generated Nexus Prisma.*/)

  expect(results.runReflectNexus.exitCode).toBe(0)

  expect(stripAnsi(results.runReflectNexus.stdout)).toMatch(/.*Generated Artifacts.*/)

  expect(results.runSecondBuildStdout.exitCode).toBe(0)

  expect(results.graphqlSchema).toMatchSnapshot()

  expect(results.typegen).toMatchSnapshot()

  /**
   * Sanity checks around runtime
   */
  // todo
  // todo start server
  // todo run queries
  // todo snapshot results
  // todo shutdown server
  // todo shutdown db server if preserve off
})

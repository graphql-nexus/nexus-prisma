import debug from 'debug'
import endent from 'endent'
import * as Execa from 'execa'
import stripAnsi from 'strip-ansi'
import { inspect } from 'util'
import { assertBuildPresent, createPrismaSchema, setupTestProject, TestProject } from '../__helpers__'

const d = debug('e2e')

interface FileSpec {
  filePath: string
  content: string
}

interface ProjectResult {
  runFirstBuild: Execa.ExecaSyncReturnValue<string>
  runReflectPrisma: Execa.ExecaSyncReturnValue<string>
  runReflectNexus: Execa.ExecaSyncReturnValue<string>
  runSecondBuild: Execa.ExecaSyncReturnValue<string>
  fileGraphqlSchema?: string
  fileTypegen?: string
}

const TYPEGEN_FILE_NAME = `typegen.ts`
const TYPEGEN_FILE_PATH = `src/${TYPEGEN_FILE_NAME}`

const GRAPHQL_SCHEMA_FILE_PATH = `schema.graphql`

function runTestProjectBuild(testProject: TestProject): ProjectResult {
  const commandConfig: Execa.SyncOptions = {
    reject: false,
    cwd: testProject.fs.cwd(),
  }
  const runFirstBuild = Execa.commandSync(`npm run build`, commandConfig)
  const runReflectPrisma = Execa.commandSync(`npm run reflect:prisma`, commandConfig)
  const runReflectNexus = Execa.commandSync(`npm run reflect:nexus`, commandConfig)
  const runSecondBuild = Execa.commandSync(`npm run build`, commandConfig)
  const fileGraphqlSchema = testProject.fs.read(GRAPHQL_SCHEMA_FILE_PATH)
  const fileTypegen = testProject.fs.read(TYPEGEN_FILE_PATH)

  return {
    runFirstBuild,
    runReflectPrisma,
    runReflectNexus,
    runSecondBuild,
    fileGraphqlSchema,
    fileTypegen,
  }
}

function setupTestNexusPrismaProject(): TestProject {
  const testProject = setupTestProject({
    tsconfigJson: {},
    packageJson: {
      license: 'MIT',
      scripts: {
        reflect: 'yarn -s reflect:prisma && yarn -s reflect:nexus',
        'reflect:prisma': 'prisma generate',
        // peer dependency check will fail since we're using yalc, e.g.:
        // " ... nexus-prisma@0.0.0-dripip+c2653557 does not officially support @prisma/client@2.22.1 ... "
        'reflect:nexus': 'cross-env REFLECTION=true ts-node --transpile-only src/schema',
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

  if (testProject.info.isReusing) {
    d(`starting project setup cleanup for reuse`)
    testProject.fs.remove(TYPEGEN_FILE_PATH)
    testProject.fs.remove('node_modules/nexus-prisma')
    testProject.runOrThrow(`yalc add nexus-prisma`)
    d(`done project setup cleanup for reuse`)
  } else {
    d(`starting project setup`)
    Execa.commandSync(`yalc publish --no-scripts`, { stdio: 'inherit' })
    testProject.runOrThrow(`yalc add nexus-prisma`, { stdio: 'inherit' })
    testProject.runOrThrow(`npm install`, { stdio: 'inherit' })
    d(`done project setup`)
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
        model Foo {
          id                String   @id
          someJsonField     Json
          someDateTimeField DateTime
          bar               Bar?
        }

        model Bar {
          id    String  @id
          foo   Foo?    @relation(fields: [fooId], references: [id])
          fooId String?
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
      filePath: `src/schema.ts`,
      content: endent/*ts*/ `
        require('dotenv').config()

        import { makeSchema, objectType, enumType, queryType } from 'nexus'
        import { Bar, Foo, E1 } from 'nexus-prisma'
        import * as customScalars from 'nexus-prisma/scalars'
        import * as Path from 'path'
        
        const types = [
          customScalars,
          enumType(E1),
          queryType({
            definition(t) {
              t.list.field('bars', {
                type: 'Bar',
                resolve(_, __, ctx) {
                  return ctx.prisma.bar.findMany()
                },
              })
            },
          }),
          objectType({
            name: Bar.$name,
            definition(t) {
              t.field(Bar.foo.name, Bar.foo)
            },
          }),
          objectType({
            name: Foo.$name,
            definition(t) {
              t.field('e1', {
                type: 'E1',
              })
              t.json('JsonManually')
              t.dateTime('DateTimeManually')
              t.field(Foo.someJsonField.name, Foo.someJsonField)
              t.field(Foo.someDateTimeField.name, Foo.someDateTimeField)
            },
          }),
        ]
        
        const schema = makeSchema({
          types,
          shouldGenerateArtifacts: true,
          shouldExitAfterGenerateArtifacts: true,
          outputs: {
            schema: true,
            typegen: Path.join(__dirname, '${TYPEGEN_FILE_NAME}'),
          },
          sourceTypes: {
            modules: [{ module: '.prisma/client', alias: 'PrismaClient' }],
          },
        })

        // wait for output generation
        setTimeout(() => {}, 1000)

        export default schema
      `,
    },
    {
      filePath: `src/context.ts`,
      content: endent/*ts*/ `
        import { PrismaClient } from '@prisma/client'

        const prisma = new PrismaClient()
        
        type Context = {
          prisma: PrismaClient
        }
        
        function context() {
          return {
            prisma,
          }
        }

        export default context
        export { Context }
      `,
    },
    {
      filePath: `src/server.ts`,
      content: endent/*ts*/ `
        require('dotenv').config()

        import { ApolloServer } from 'apollo-server'
        import context from './context'
        import schema from './schema'

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
  console.log(`e2e test project at: ${testProject.fs.cwd()}`)

  const results = runTestProjectBuild(testProject)

  // uncomment this to see the raw results (helpful for debugging)
  console.log(`e2e output:\n`, inspect(results, { depth: 10, colors: true }))

  /**
   * Sanity checks around buildtime
   */

  expect(results.runFirstBuild.exitCode).toBe(2)

  expect(stripAnsi(results.runFirstBuild.stdout)).toMatch(
    /.*error TS2305: Module '"nexus-prisma"' has no exported member 'Bar'.*/
  )
  expect(stripAnsi(results.runFirstBuild.stdout)).toMatch(
    /.*error TS2305: Module '"nexus-prisma"' has no exported member 'Foo'.*/
  )
  expect(stripAnsi(results.runFirstBuild.stdout)).toMatch(
    /.*error TS2305: Module '"nexus-prisma"' has no exported member 'E1'.*/
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

  expect(results.runSecondBuild.exitCode).toBe(0)

  expect(results.fileGraphqlSchema).toMatchSnapshot('graphql schema')

  expect(results.fileTypegen).toMatchSnapshot('nexus typegen')

  /**
   * Sanity checks around runtime
   */
  // todo
  // todo start db     testProject.runOrThrow(`yarn -s db:up`, { stdio: 'inherit' })
  // todo start server
  // todo run queries
  // todo snapshot results
  // todo shutdown server
  // todo shutdown db server if preserve off
})

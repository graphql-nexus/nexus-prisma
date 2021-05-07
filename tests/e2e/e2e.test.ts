import * as Execa from 'execa'
import { dump } from 'nexus/dist/utils'
import stripAnsi from 'strip-ansi'
import { assertBuildPresent, createPrismaSchema, setupTestProject, TestProject } from '../__helpers__'

function setupTestProjectCase({
  prismaSchema,
  main,
  testProject,
}: {
  testProject: TestProject
  prismaSchema: string
  main: string
}) {
  testProject.tmpdir.write('main.ts', main)
  testProject.tmpdir.write('prisma/schema.prisma', prismaSchema)
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
    cwd: testProject.tmpdir.cwd(),
  }
  const runFirstBuild = Execa.commandSync(`npm run build`, commandConfig)
  const runReflectPrisma = Execa.commandSync(`npm run reflect:prisma`, commandConfig)
  const runReflectNexus = Execa.commandSync(`npm run reflect:nexus`, commandConfig)
  const runSecondBuildStdout = Execa.commandSync(`npm run build`, commandConfig)
  const graphqlSchema = testProject.tmpdir.read('schema.graphql')
  const typegen = testProject.tmpdir.read('typegen.ts')

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
        'reflect:prisma': 'prisma generate',
        // peer dependency check will fail since we're using yalc, e.g.:
        // " ... nexus-prisma@0.0.0-dripip+c2653557 does not officially support @prisma/client@2.22.1 ... "
        'reflect:nexus': 'NO_PEER_DEPENDENCY_CHECK=true ts-node --transpile-only main',
        build: 'tsc',
      },
      dependencies: {
        '@prisma/client': '^2.18.0',
        '@types/node': '^14.14.32',
        graphql: '^15.5.0',
        nexus: '^1.0.0',
        prisma: '^2.18.0',
        'ts-node': '^9.1.1',
        typescript: '^4.2.3',
      },
    },
  })

  Execa.commandSync(`yalc publish --no-scripts`)
  testProject.run(`yalc add nexus-prisma`)
  testProject.run(`npm install`)

  return testProject
}

let testProject: TestProject

beforeAll(() => {
  assertBuildPresent()
  testProject = setupTestNexusPrismaProject()
})

it('When bundled custom scalars are used the project type checks and generates expected GraphQL schema', () => {
  setupTestProjectCase({
    testProject,
    prismaSchema: createPrismaSchema(`
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
    main: /*ts*/ `
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
  })

  // todo api server & database & seed that allows for testing that prisma runtime usage works

  // uncomment this to see dir (helpful to go there yourself and manually debug)
  console.log(testProject.tmpdir.cwd())

  const results = runTestProject(testProject)

  // uncomment this to see the raw results (helpful for debugging)
  dump(results)

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
})

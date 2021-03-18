import * as Execa from 'execa'
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
      scripts: {
        'reflect:prisma': 'prisma generate',
        'reflect:nexus': 'ts-node --transpile-only main',
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
    main: `
      import { makeSchema, objectType } from 'nexus'
      import { M1 } from 'nexus-prisma'
      import * as customScalars from 'nexus-prisma/scalars'
      import * as Path from 'path'
      
      const SomeObject = objectType({
        name: 'SomeObject',
        definition(t) {
          t.json('JsonManually')
          t.dateTime('DateTimeManually')
          t.field(M1.someJsonField.name, M1.someJsonField)
          t.field(M1.someDateTimeField.name, M1.someDateTimeField)
        },
      })
      
      makeSchema({
        types: [customScalars, SomeObject],
        shouldGenerateArtifacts: true,
        shouldExitAfterGenerateArtifacts: true,
        outputs: {
          schema: true,
          typegen: Path.join(__dirname, 'typegen.ts'),
        },
      })

      // wait for output generation
      setTimeout(() => {}, 1000)
    `,
    prismaSchema: createPrismaSchema(`
      model M1 {
        id                String   @id
        someJsonField     Json
        someDateTimeField DateTime
      }
    `),
  })

  // uncomment this to see dir (helpful to go there yourself and manually debug)
  // console.log(testProject.tmpdir.cwd())

  const results = runTestProject(testProject)

  // uncomment this to see the raw results (helpful for debugging)
  // dump(results)

  expect(results.runFirstBuild.exitCode).toBe(2)

  expect(stripAnsi(results.runFirstBuild.stdout)).toMatch(
    /.*error TS2305: Module '"nexus-prisma"' has no exported member 'M1'.*/
  )
  expect(stripAnsi(results.runFirstBuild.stdout)).toMatch(
    /.*error TS2339: Property 'json' does not exist on type 'ObjectDefinitionBlock<"SomeObject">'.*/
  )
  expect(stripAnsi(results.runFirstBuild.stdout)).toMatch(
    /.*error TS2339: Property 'dateTime' does not exist on type 'ObjectDefinitionBlock<"SomeObject">'.*/
  )

  expect(results.runReflectPrisma.exitCode).toBe(0)

  expect(stripAnsi(results.runReflectPrisma.stdout)).toMatch(/.*Generated Nexus Prisma.*/)

  expect(results.runReflectNexus.exitCode).toBe(0)

  expect(stripAnsi(results.runReflectNexus.stdout)).toMatch(/.*Generated Artifacts.*/)

  expect(results.runSecondBuildStdout.exitCode).toBe(0)

  expect(results.graphqlSchema).toMatchSnapshot()

  expect(results.typegen).toMatchSnapshot()
})

import debug from 'debug'
import dindist from 'dindist'
import * as Execa from 'execa'
import { gql } from 'graphql-request'
import * as GQLScalars from 'graphql-scalars'
import { konn, providers } from 'konn'
import * as Path from 'path'
import stripAnsi from 'strip-ansi'

import { envarSpecs } from '../../src/lib/peerDepValidator'
import { createPrismaSchema, stripEndingLines, timeoutRace } from '../__helpers__/helpers'
import { graphQLClient } from '../__providers__/graphqlClient'
import { project } from '../__providers__/project'
import { monitorAsyncMethod, run } from '../__providers__/run'

const d = debug('e2e')

type FileSpec = {
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

const SERVER_READY_MESSAGE = `GraphQL API ready at http://localhost:4000/graphql`

async function runTestProjectBuild(): Promise<ProjectResult> {
  const runFirstBuild = await ctx.runPackagerCommandAsyncGracefully('run build')
  const runReflectPrisma = await ctx.runPackagerCommandAsyncGracefully('run reflect:prisma')
  const runReflectNexus = await ctx.runPackagerCommandAsyncGracefully('run reflect:nexus')
  const runSecondBuild = await ctx.runPackagerCommandAsyncGracefully('run build')
  const fileGraphqlSchema = await ctx.fs.readAsync(GRAPHQL_SCHEMA_FILE_PATH)
  const fileTypegen = await ctx.fs.readAsync(TYPEGEN_FILE_PATH)

  return {
    runFirstBuild,
    runReflectPrisma,
    runReflectNexus,
    runSecondBuild,
    fileGraphqlSchema,
    fileTypegen,
  }
}

const ctx = konn()
  .useBeforeEach(providers.dir())
  .useBeforeEach(run())
  .useBeforeEach(project())
  .useBeforeEach(graphQLClient())
  .done()

beforeEach(async () => {
  await ctx.fixture.useAsync(Path.join(__dirname, 'fixtures/kitchen-sink'))
  if (process.env.PAST_VERSION && process.env.PAST_VERSION.indexOf('prisma') !== -1) {
    await ctx.packageJson.mergeAsync({
      devDependencies: {
        typescript: '4.7.4',
      },
    })
  }
  await monitorAsyncMethod(
    ctx.runAsyncOrThrow(`${Path.join(process.cwd(), `node_modules/.bin/yalc`)} add ${ctx.thisPackageName}`), 
    30 *1000
  )
  await monitorAsyncMethod(
    ctx.runPackagerCommandAsyncOrThrow('install --legacy-peer-deps', {
      env: { PEER_DEPENDENCY_CHECK: 'false' },
    }),
    90 * 1000
  )
}, 120 * 1000)

// TODO add an ESM test

it('A full-featured project type checks, generates expected GraphQL schema, and successfully resolves received GraphQL documents', async () => {
  const files: FileSpec[] = [
    {
      filePath: `prisma/schema.prisma`,
      content: createPrismaSchema({
        content: dindist`
          model Foo {
            id                 String     @id
            someJsonField      Json
            someDateTimeField  DateTime
            someDecimalField   Decimal
            someBytesField     Bytes
            someBigIntField    BigInt
            someEnumA          SomeEnumA
            bar                Bar?
            quxs               Qux[]
          }

          model Bar {
            id     String   @id
            foo    Foo?     @relation(fields: [fooId], references: [id])
            fooId  String?  @unique
          }

          // This type "Qux" will not be projected
          // This has ramifications for the type generation where Foo.quxs must handle
          // that Nexus does not have Qux defined in the API.

          model Qux {
            id     String  @id
            fooId  String
            foo    Foo     @relation(fields: [fooId], references: [id])
          }

          enum SomeEnumA {
            alpha
            bravo
            charlie
          }
        `,
      }),
    },
    {
      filePath: `prisma/seed.ts`,
      content: dindist`
        import { PrismaClient, Prisma } from '@prisma/client'

        main()

        async function main() {
          const prisma = new PrismaClient()

          await prisma.$executeRaw\`TRUNCATE "Foo", "Bar", "Qux"\`
          await prisma.foo.create({
            data: {
              id: 'foo1',
              someDateTimeField: new Date("2021-05-10T20:42:46.609Z"),
              someDecimalField: 24.454545,
              someBytesField: Buffer.from([]),
              someJsonField: {},
              someBigIntField: BigInt(9007199254740991),
              someEnumA: 'alpha',
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
      content: dindist`
        require('dotenv').config()

        import { makeSchema, objectType, enumType, queryType } from 'nexus'
        import { Bar, Foo, SomeEnumA, $settings } from 'nexus-prisma'
        import * as customScalars from 'nexus-prisma/scalars'
        import * as Path from 'path'

        // Show that we can import and call settings as a NOOP
        $settings({})
        
        const types = [
          customScalars,
          enumType(SomeEnumA),
          queryType({
            definition(t) {
              t.list.field({
                name: 'bars',
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
              t.field(Bar.foo)
            },
          }),
          objectType({
            name: Foo.$name,
            definition(t) {
              t.field({
                name: 'someEnumA',
                type: 'SomeEnumA',
              })
              t.json('JsonManually')
              t.dateTime('DateTimeManually')
              t.bytes('BytesManually')
              t.decimal('DecimalManually')
              t.bigInt('BigIntManually')
              t.field(Foo.someBigIntField)
              t.field(Foo.someJsonField)
              t.field(Foo.someDateTimeField)
              t.field(Foo.someBytesField)
              t.field(Foo.someDecimalField)
            },
          }),
        ]
        
        const schema = makeSchema({
          types,
          shouldGenerateArtifacts: true,
          shouldExitAfterGenerateArtifacts: Boolean(process.env.REFLECT),
          outputs: {
            schema: true,
            typegen: Path.join(__dirname, '${TYPEGEN_FILE_NAME}'),
          },
          sourceTypes: {
            modules: [{ module: '.prisma/client', alias: 'PrismaClient' }],
          },
        })

        export default schema
      `,
    },
    {
      filePath: `src/context.ts`,
      content: dindist`
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
      content: dindist`
        require('dotenv').config()

        import { ApolloServer } from 'apollo-server'
        import context from './context'
        import schema from './schema'

        const apollo = new ApolloServer({
          schema,
          context,
        })

        apollo.listen(4000, () => {
          console.log('${SERVER_READY_MESSAGE}')
        })
      `,
    },
    {
      filePath: `.env`,
      // prettier-ignore
      content: dindist`
        DB_URL="postgresql://postgres:postgres@localhost/nexus-prisma?schema=${process.env.E2E_DB_SCHEMA ?? 'local'}"
        ${envarSpecs.NO_PEER_DEPENDENCY_CHECK.name}="true"
        `,
    },
  ]

  for await (const fileSpec of files) {
    await ctx.fs.writeAsync(fileSpec.filePath, fileSpec.content)
  }

  // todo api server & database & seed that allows for testing that prisma runtime usage works

  const results = await runTestProjectBuild()

  // uncomment this to see the raw results (helpful for debugging)
  // console.log(`e2e output:\n`, inspect(results, { depth: 10, colors: true }))

  /**
   * Sanity checks around buildtime
   */
  d(`assert various aspects of the buildtime results`)

  expect(results.runFirstBuild.exitCode).toBe(2)

  expect(stripAnsi(results.runFirstBuild.stdout)).toMatch(
    /.*error TS2305: Module '"nexus-prisma"' has no exported member '\$settings'.*/
  )
  expect(stripAnsi(results.runFirstBuild.stdout)).toMatch(
    /.*error TS2305: Module '"nexus-prisma"' has no exported member 'Bar'.*/
  )
  expect(stripAnsi(results.runFirstBuild.stdout)).toMatch(
    /.*error TS2305: Module '"nexus-prisma"' has no exported member 'Foo'.*/
  )
  expect(stripAnsi(results.runFirstBuild.stdout)).toMatch(
    /.*error TS2305: Module '"nexus-prisma"' has no exported member 'SomeEnumA'.*/
  )
  expect(stripAnsi(results.runFirstBuild.stdout)).toMatch(
    /.*error TS2339: Property 'json' does not exist on type 'ObjectDefinitionBlock<any>'.*/
  )
  expect(stripAnsi(results.runFirstBuild.stdout)).toMatch(
    /.*error TS2339: Property 'dateTime' does not exist on type 'ObjectDefinitionBlock<any>'.*/
  )
  expect(stripAnsi(results.runFirstBuild.stdout)).toMatch(
    /.*error TS2339: Property 'bigInt' does not exist on type 'ObjectDefinitionBlock<any>'.*/
  )

  expect(results.runReflectPrisma.exitCode).toBe(0)

  expect(stripAnsi(results.runReflectPrisma.stdout)).toMatch(/.*Generated Nexus Prisma.*/)

  expect(results.runReflectNexus.exitCode).toBe(0)

  expect(stripAnsi(results.runReflectNexus.stdout)).toMatch(/.*Generated Artifacts.*/)

  expect(results.runSecondBuild.exitCode).toBe(0)

  expect(stripEndingLines(results.fileGraphqlSchema)).toMatchSnapshot('graphql schema')

  expect(results.fileTypegen).toMatchSnapshot('nexus typegen')

  /**
   * Sanity check the Prisma Client import ID
   */

  expect(ctx.fs.read('node_modules/.nexus-prisma/index.js')).toMatch(
    /.*"prismaClientImportId": "@prisma\/client".*/
  )

  if (process.env.DATABASE === 'no-db') {
    d(`database not available, skipping runtime test`)
    expect.assertions(16)
    return
  } else {
    expect.assertions(26)
  }

  /**
   * Sanity check the runtime
   */

  d(`migrating database`)

  await ctx.runPackagerCommandAsyncOrThrow('run db:migrate')

  d(`starting server`)

  const serverProcess = ctx.runAsyncOrThrow(`node build/server`, { reject: false })
  serverProcess.stdout!.pipe(process.stdout)

  const result = await timeoutRace<'server_started'>(
    [
      new Promise((res) =>
        serverProcess.stdout!.on('data', (data: Buffer) => {
          if (data.toString().match(SERVER_READY_MESSAGE)) res('server_started')
        })
      ),
    ],
    10_000
  )

  if (result === 'timeout') {
    throw new Error(
      `server was not ready after 10 seconds. The output from child process was:\n\n${serverProcess.stdio.toString()}\n\n`
    )
  }
  d(`starting client queries`)

  const data = await ctx.graphQLClient.request(gql`
    query {
      bars {
        foo {
          JsonManually
          DateTimeManually
          BytesManually
          DecimalManually
          BigIntManually
          someEnumA
          someJsonField
          someDateTimeField
          someBytesField
          someDecimalField
          someBigIntField
        }
      }
    }
  `)

  d(`stopping server`)

  serverProcess.cancel()
  // On Windows the serverProcess never completes the promise so we do an ugly timeout here
  // and rely on jest --forceExit to terminate the process

  await timeoutRace([serverProcess], 2_000)

  d(`stopped server`)
  expect(data).toMatchInlineSnapshot(`
    {
      "bars": [
        {
          "foo": {
            "BigIntManually": null,
            "BytesManually": null,
            "DateTimeManually": null,
            "DecimalManually": null,
            "JsonManually": null,
            "someBigIntField": 9007199254740991,
            "someBytesField": {
              "data": [],
              "type": "Buffer",
            },
            "someDateTimeField": "2021-05-10T20:42:46.609Z",
            "someDecimalField": "24.454545",
            "someEnumA": "alpha",
            "someJsonField": {},
          },
        },
      ],
    }
  `)

  const [{ foo }] = data.bars

  expect(foo.JsonManually).toBeNull()
  expect(foo.DateTimeManually).toBeNull()
  expect(foo.BytesManually).toBeNull()
  expect(foo.BigIntManually).toBeNull()
  expect(typeof foo.someEnumA).toEqual('string')
  expect(typeof foo.someJsonField).toEqual('object')
  expect(typeof foo.someDateTimeField).toEqual('string')
  expect(typeof foo.someBytesField).toEqual('object')
  expect(typeof GQLScalars.BigIntResolver.parseValue(foo.someBigIntField)).toEqual('bigint')
}, 120_000)

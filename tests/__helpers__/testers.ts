import * as PrismaSDK from '@prisma/sdk'
import dedent from 'dindist'
import execa from 'execa'
import * as fs from 'fs-jetpack'
import { DocumentNode, execute, printSchema } from 'graphql'
import { core } from 'nexus'
import { AllNexusTypeDefs } from 'nexus/dist/core'
import * as Path from 'path'
import { generateRuntime } from '../../src/generator/generate'
import { Gentime } from '../../src/generator/gentime/settingsSingleton'
import * as ModelsGenerator from '../../src/generator/models'
import { Settings } from '../../src/generator/models/javascript'
import { Runtime } from '../../src/generator/runtime/settingsSingleton'
import { ModuleSpec } from '../../src/generator/types'
import { DMMF } from '@prisma/generator-helper'
import slug from 'slug'

const settingsDefaults: Settings = {
  gentime: Gentime.settings.data,
  runtime: Runtime.settings,
}

/**
 * Define Nexus type definitions based on the Nexus Prisma configurations
 *
 * The configurations are typed as `any` to make them easy to work with. They ae not typesafe. Be careful.
 */
type APISchemaSpec = (nexusPrisma: any) => AllNexusTypeDefs[]

export type IntegrationTestSpec = {
  /**
   * Name of this test
   */
  description: string
  /**
   * Define a Prisma schema file
   *
   * Note datasource and generator blocks are taken care of automatically for you.
   */
  datasourceSchema: string
  /**
   * Define the GraphQL API. All returned type defs are added to the final GraphQL schema.
   */
  apiSchema: APISchemaSpec
  /**
   * Access the Prisma Client instance and run some setup side-effects.
   *
   * Examples of things to do there:
   *
   * 1. Seed the database.
   */
  setup?: (prismaClient: any) => Promise<void>
  /**
   * Handle instantiation of a Prisma Client instance.
   *
   * Examples of things to do there:
   *
   * 1. Customize the Prisma Client settings.
   */
  prismaClient?: (prismaClientPackage: any) => Promise<any>
  /**
   * A Graphql document to execute against the GraphQL API. The result is snapshotted.
   */
  apiClientQuery: DocumentNode
}

type IntegrationTestParams = IntegrationTestSpec & {
  /**
   * Proxy for it.only
   */
  only?: boolean
  /**
   * Proxy for it.skip
   */
  skip?: boolean
}

/**
 * Test that the given Prisma schema generates the expected generated source code.
 */
export function testGeneratedModules(params: {
  description: string
  databaseSchema: string
  /**
   * The gentime settings to use.
   */
  settings?: Gentime.SettingsInput
}) {
  it(params.description, async () => {
    Gentime.settings.reset()
    if (params.settings) {
      Gentime.settings.change(params.settings)
    }
    const { indexdts } = await generateModules(params.databaseSchema)
    expect(indexdts).toMatchSnapshot('index.d.ts')
  })
}

/**
 * Test that the given Prisma schema + API Schema + data seed + GraphQL document lead to the expected
 * GraphQL schema and execution result.
 */
export const testIntegration = (params: IntegrationTestParams) => {
  if (params.skip && params.only)
    throw new Error(`Cannot specify to skip this test AND only run this test at the same time.`)

  const test = params.only ? it.only : params.skip ? it.skip : it

  test(
    params.description,
    async () => {
      const result = await integrationTest(params)
      expect(result.graphqlSchemaSDL).toMatchSnapshot(`graphqlSchemaSDL`)
      expect(result.graphqlOperationExecutionResult).toMatchSnapshot(`graphqlOperationExecutionResult`)
    },
    30_000
  )
}

/**
 * Test that the given Prisma schema + API Schema lead to the expected GraphQL schema.
 */
export function testGraphqlSchema(params: {
  datasourceSchema: string
  description: string
  apiSchema: APISchemaSpec
}) {
  it(params.description, async () => {
    const dmmf = await PrismaSDK.getDMMF({
      datamodel: createPrismaSchema({ content: params.datasourceSchema }),
    })

    const nexusPrisma = ModelsGenerator.JS.createNexusTypeDefConfigurations(dmmf, settingsDefaults) as any

    const { schema } = await core.generateSchema.withArtifacts({
      types: params.apiSchema(nexusPrisma),
    })

    expect(prepareGraphQLSDLForSnapshot(printSchema(schema))).toMatchSnapshot('graphqlSchema')
  })
}

/**
 * Low Level
 */

/**
 * Given a Prisma schema and Nexus type definitions return a GraphQL schema.
 */
export const integrationTest = async ({
  datasourceSchema,
  apiSchema,
  setup,
  prismaClient: setupPrismaClient,
  apiClientQuery,
  description,
}: IntegrationTestParams) => {
  const outputDir = Path.join(process.cwd(), 'tests/__cache__/integration/', slug(description))
  const prismaClientOutputDir = './client'
  const prismaClientOutputDirAbsolute = Path.posix.join(outputDir, prismaClientOutputDir)
  const sqliteDatabaseFileOutput = './db.sqlite'
  const sqliteDatabaseFileOutputAbsolute = Path.join(outputDir, sqliteDatabaseFileOutput)
  const dmmfFileOutputAbsolute = Path.join(outputDir, 'dmmf.json')
  const prismaSchemaContents = createPrismaSchema({
    content: datasourceSchema,
    datasourceProvider: {
      provider: 'sqlite',
      url: `file:${sqliteDatabaseFileOutput}`,
    },
    nexusPrisma: false,
    clientOutput: prismaClientOutputDir,
  })

  const cacheHit = fs.exists(prismaClientOutputDirAbsolute)
  let dmmf: DMMF.Document

  if (!cacheHit) {
    fs.write(`${outputDir}/schema.prisma`, prismaSchemaContents)
    execa.commandSync(`yarn -s prisma db push --force-reset --schema ${outputDir}/schema.prisma`)
    fs.copy(sqliteDatabaseFileOutputAbsolute, `${sqliteDatabaseFileOutputAbsolute}.bak`)
    dmmf = await PrismaSDK.getDMMF({
      datamodel: prismaSchemaContents,
    })
    fs.write(dmmfFileOutputAbsolute, dmmf)
  } else {
    // restore empty database
    fs.copy(`${sqliteDatabaseFileOutputAbsolute}.bak`, sqliteDatabaseFileOutputAbsolute, { overwrite: true })
    dmmf = fs.read(dmmfFileOutputAbsolute, 'json')
  }

  const prismaClientPackage = require(prismaClientOutputDirAbsolute)

  const prismaClient = setupPrismaClient
    ? setupPrismaClient(prismaClientPackage)
    : new prismaClientPackage.PrismaClient()

  if (setup) {
    await setup(prismaClient)
  }

  const nexusPrisma = ModelsGenerator.JS.createNexusTypeDefConfigurations(dmmf, {
    ...settingsDefaults,
    gentime: {
      ...settingsDefaults.gentime,
      prismaClientImportId: prismaClientOutputDirAbsolute,
    },
  }) as any

  const { schema } = await core.generateSchema.withArtifacts({
    types: apiSchema(nexusPrisma),
  })

  const graphqlOperationExecutionResult = await execute({
    contextValue: {
      prisma: prismaClient,
    },
    schema: schema,
    document: apiClientQuery,
  })

  /**
   * Automatically await disconnect. However only if it is actually a Prisma Client instance.
   *
   * Sometimes tests might pass bad data on purpose to test our checks system.
   */
  if (prismaClient instanceof prismaClientPackage.PrismaClient) {
    await prismaClient.$disconnect()
  }

  // if (graphqlOperationExecutionResult.errors) {
  //   throw new Error(
  //     `GraphQL operation failed:\n\n  - ${graphqlOperationExecutionResult.errors.join('\n  - ')}`
  //   )
  // }

  return {
    graphqlSchemaSDL: prepareGraphQLSDLForSnapshot(printSchema(schema)),
    graphqlOperationExecutionResult,
  }
}

function prepareGraphQLSDLForSnapshot(sdl: string): string {
  return '\n' + stripNexusQueryOk(sdl).trim() + '\n'
}

function stripNexusQueryOk(sdl: string): string {
  return sdl.replace(
    dedent`
      type Query {
        ok: Boolean!
      }
    `,
    ''
  )
}

/**
 * Create the contents of a Prisma Schema file.
 */
export function createPrismaSchema({
  content,
  datasourceProvider,
  clientOutput,
  nexusPrisma,
}: {
  content: string
  /**
   * The datasource provider block. Defaults to postgres provider with DB_URL envar lookup.
   */
  datasourceProvider?: { provider: 'sqlite'; url: string } | { provider: 'postgres'; url: string }
  /**
   * Specify the prisma client generator block output configuration. By default is unspecified and uses the Prisma client generator default.
   */
  clientOutput?: string
  /**
   * Should the Nexus Prisma generator block be added.
   *
   * @default true
   */
  nexusPrisma?: boolean
}): string {
  const outputConfiguration = clientOutput ? `\n  output = "${clientOutput}"` : ''
  const nexusPrisma_ = nexusPrisma ?? true
  const datasourceProvider_ = datasourceProvider
    ? {
        ...datasourceProvider,
        url: datasourceProvider.url.startsWith('env')
          ? datasourceProvider.url
          : `"${datasourceProvider.url}"`,
      }
    : {
        provider: 'postgres',
        url: 'env("DB_URL")',
      }

  return dedent`
    datasource db {
      provider = "${datasourceProvider_.provider}"
      url      = ${datasourceProvider_.url}
    }

    generator client {
      provider = "prisma-client-js"${outputConfiguration}
    }

    ${
      nexusPrisma_
        ? dedent`
            generator nexusPrisma {
              provider = "nexus-prisma"
            }
          `
        : ``
    }

    ${content}
  `
}

/**
 * For the given Prisma Schema generate the derived source code.
 */
export async function generateModules(
  content: string
): Promise<{ indexjs_esm: string; indexjs_cjs: string; indexdts: string }> {
  const prismaSchemaContents = createPrismaSchema({ content })

  const dmmf = await PrismaSDK.getDMMF({
    datamodel: prismaSchemaContents,
  })

  const [indexjs_esm, indexjs_cjs, indexdts] = generateRuntime(dmmf, Gentime.settings) as [
    ModuleSpec,
    ModuleSpec,
    ModuleSpec
  ]

  return {
    indexdts: indexdts.content,
    indexjs_esm: indexjs_esm.content,
    indexjs_cjs: indexjs_cjs.content,
  }
}

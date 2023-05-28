import execa from 'execa'
import * as fs from 'fs-jetpack'
import { DocumentNode, execute, ExecutionResult, printSchema } from 'graphql'
import { core } from 'nexus'
import { AllNexusTypeDefs } from 'nexus/dist/core'
import objectHash from 'object-hash'
import * as Path from 'path'
import slug from 'slug'

import { DMMF } from '@prisma/generator-helper'
import * as PrismaInternals from '@prisma/internals'

import { generateRuntime } from '../../src/generator/generate'
import { Module } from '../../src/generator/helpers/types'
import { ModuleGenerators } from '../../src/generator/ModuleGenerators'
import { Settings } from '../../src/generator/Settings'
import { createConsoleLogCapture, createPrismaSchema, prepareGraphQLSDLForSnapshot } from './helpers'
import { getPackageManager } from './packageManager'

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
  database: string
  /**
   * Define the GraphQL API. All returned type defs are added to the final GraphQL schema.
   */
  api: APISchemaSpec
  /**
   * Get access to the gentime settings like you would in the gentime config file.
   */
  nexusPrismaGentimeConfig?(settings: Settings.Gentime.Manager): void
  nexusPrismaRuntimeConfig?(settings: Settings.Runtime.Manager): void
  /**
   * Access the Prisma Client instance and run some setup side-effects.
   *
   * Examples of things to do there:
   *
   * 1. Seed the database.
   */
  setup?(prismaClient: any): Promise<void>
  /**
   * Handle instantiation of a Prisma Client instance.
   *
   * Examples of things to do there:
   *
   * 1. Customize the Prisma Client settings.
   */
  prismaClient?(prismaClientPackage: any): Promise<any>
  /**
   * A Graphql document to execute against the GraphQL API. The result is snapshotted.
   */
  client: DocumentNode
}

export type TestIntegrationParams = IntegrationTestSpec & {
  /**
   * Proxy for it.only
   */
  only?: boolean
  /**
   * Proxy for it.skip
   */
  skip?: boolean
  expect?(result: {
    logs: string[]
    graphqlSchemaSDL: string
    graphqlOperationExecutionResult: ExecutionResult
  }): void
}

/**
 * Test that the given Prisma schema generates the expected generated source code.
 */
export const testGeneratedModules = (params: {
  description: string
  databaseSchema: string
  /**
   * The gentime settings to use.
   */
  settings?: Settings.Gentime.Input
}) => {
  it(params.description, async () => {
    Settings.Gentime.settings.reset()
    if (params.settings) {
      Settings.Gentime.settings.change(params.settings)
    }
    const { indexdts } = await generateModules(params.databaseSchema)
    expect(indexdts).toMatchSnapshot('index.d.ts')
  })
}

/**
 * Test that the given Prisma schema + API Schema + data seed + GraphQL document lead to the expected
 * GraphQL schema and execution result.
 */
export const testIntegration = (params: TestIntegrationParams) => {
  if (params.skip && params.only)
    throw new Error(`Cannot specify to skip this test AND only run this test at the same time.`)

  const test = params.only ? it.only : params.skip ? it.skip : it

  test(
    params.description,
    async () => {
      const result = await integrationTest(params)
      if (params.expect) {
        expect.assertions(0)
        params.expect(result)
      } else {
        expect.assertions(3)
        expect(result.logs).toMatchSnapshot(`logs`)
        expect(result.graphqlSchemaSDL).toMatchSnapshot(`graphqlSchemaSDL`)
        expect(result.graphqlOperationExecutionResult).toMatchSnapshot(`graphqlOperationExecutionResult`)
      }
    },
    60_000
  )
}

export const testIntegrationPartial = <T extends Partial<Omit<TestIntegrationParams, 'description'>>>(
  params: T
): T => {
  return params
}

/**
 * Test that the given Prisma schema + API Schema lead to the expected GraphQL schema.
 */
export const testGraphqlSchema = (
  params: Pick<TestIntegrationParams, 'api' | 'description' | 'database'>
) => {
  it(params.description, async () => {
    expect.assertions(1)
    const dmmf = await PrismaInternals.getDMMF({
      datamodel: createPrismaSchema({
        content: params.database,
      }),
    })

    const runtimeSettings = Settings.Runtime.create()
    const gentimeSettings = Settings.Gentime.create()

    const nexusPrisma = ModuleGenerators.JS.createNexusTypeDefConfigurations(dmmf, {
      gentime: gentimeSettings.data,
      runtime: runtimeSettings,
    }) as any

    const { schema } = await core.generateSchema.withArtifacts({
      types: params.api(nexusPrisma),
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
export const integrationTest = async (params: TestIntegrationParams) => {
  /**
   * On windows "File name too long" errors can occur. For that reason we do not pass through the test description which may be very long when on Windows.
   */
  const outputDirName =
    process.platform === 'win32' ? objectHash({ description: params.description }) : slug(params.description)
  const outputDirPath = Path.join(process.cwd(), 'tests/__cache__/integration/', outputDirName)
  const prismaClientOutputDir = './client'
  const prismaClientOutputDirAbsolute = Path.posix.join(outputDirPath, prismaClientOutputDir)
  const sqliteDatabaseFileOutput = './db.sqlite'
  const sqliteDatabaseFileOutputAbsolute = Path.join(outputDirPath, sqliteDatabaseFileOutput)
  const dmmfFileOutputAbsolute = Path.join(outputDirPath, 'dmmf.json')
  const prismaSchemaContents = createPrismaSchema({
    content: params.database,
    datasourceProvider: {
      provider: 'sqlite',
      url: `file:${sqliteDatabaseFileOutput}`,
    },
    nexusPrisma: false,
    clientOutput: prismaClientOutputDir,
  })

  const cacheHit = await fs.existsAsync(prismaClientOutputDirAbsolute)
  let dmmf: DMMF.Document

  if (!cacheHit) {
    await fs.writeAsync(`${outputDirPath}/schema.prisma`, prismaSchemaContents)
    await execa.command(
      `${getPackageManager()} -s prisma db push --force-reset --schema ${outputDirPath}/schema.prisma`
    )
    await fs.copyAsync(sqliteDatabaseFileOutputAbsolute, `${sqliteDatabaseFileOutputAbsolute}.bak`)
    dmmf = await PrismaInternals.getDMMF({
      datamodel: prismaSchemaContents,
    })
    await fs.writeAsync(dmmfFileOutputAbsolute, dmmf)
  } else {
    // restore empty database
    await fs.copyAsync(`${sqliteDatabaseFileOutputAbsolute}.bak`, sqliteDatabaseFileOutputAbsolute, {
      overwrite: true,
    })
    dmmf = await fs.readAsync(dmmfFileOutputAbsolute, 'json')
  }

  const prismaClientPackage = require(prismaClientOutputDirAbsolute)

  /**
   * Maintain a controlled prisma client instance. This is so that tests can run setup with a functioning client while also
   * having freedom to much around with the prisma client instance that the application under test will get. These are
   * different concerns:
   *
   * 1. Prisma Client for scaffolding data for the test itself.
   * 2. Prisma Client for Nexus Prisma to use in an application
   *
   * Some tests will intentionally create a bad prisma client instance to test gracefully error handling.
   */
  const prismaClientInternal = new prismaClientPackage.PrismaClient()

  const prismaClient = params.prismaClient
    ? params.prismaClient(prismaClientPackage)
    : new prismaClientPackage.PrismaClient()

  if (params.setup) {
    await params.setup(prismaClientInternal)
  }

  const runtimeSettings = Settings.Runtime.create()
  const gentimeSettings = Settings.Gentime.create()

  gentimeSettings.change({
    prismaClientImportId: prismaClientOutputDirAbsolute,
  })

  if (params.nexusPrismaGentimeConfig) {
    params.nexusPrismaGentimeConfig(gentimeSettings)
  }

  if (params.nexusPrismaRuntimeConfig) {
    params.nexusPrismaRuntimeConfig(runtimeSettings)
  }

  /**
   * Application Logic Simulation Start
   *
   * Capture log output during this phase. This allows tests to assert on log output.
   * Log output can be an important part of DX. It also can be a strong indicator of what logic has been run.
   */

  const logCap = createConsoleLogCapture()
  let graphqlOperationExecutionResult
  let schema
  try {
    logCap.start()

    const nexusPrisma = ModuleGenerators.JS.createNexusTypeDefConfigurations(dmmf, {
      runtime: runtimeSettings,
      gentime: gentimeSettings.data,
    }) as any

    const artifacts = await core.generateSchema.withArtifacts({
      types: params.api(nexusPrisma),
    })

    schema = artifacts.schema

    graphqlOperationExecutionResult = await execute({
      contextValue: {
        prisma: prismaClient,
      },
      schema: schema,
      document: params.client,
    })
  } catch (e) {
    logCap.stop()
    throw e
  }
  logCap.stop()

  /**
   * Application Logic Simulation End
   */

  /**
   * Automatically await disconnect. However only if it is actually a Prisma Client instance.
   *
   * Sometimes tests might pass bad data on purpose to test our checks system.
   */
  if (prismaClient instanceof prismaClientPackage.PrismaClient) {
    await prismaClient.$disconnect()
  }

  await prismaClientInternal.$disconnect()

  return {
    graphqlSchemaSDL: prepareGraphQLSDLForSnapshot(printSchema(schema)),
    graphqlOperationExecutionResult,
    logs: logCap.logs,
  }
}

/**
 * For the given Prisma Schema generate the derived source code.
 */
export async function generateModules(
  content: string
): Promise<{ indexjs_esm: string; indexjs_cjs: string; indexdts: string }> {
  const prismaSchemaContents = createPrismaSchema({ content })

  const dmmf = await PrismaInternals.getDMMF({
    datamodel: prismaSchemaContents,
  })

  const [indexjs_esm, indexjs_cjs, indexdts] = generateRuntime(dmmf, Settings.Gentime.settings) as [
    Module,
    Module,
    Module
  ]

  return {
    indexdts: indexdts.content,
    indexjs_esm: indexjs_esm.content,
    indexjs_cjs: indexjs_cjs.content,
  }
}

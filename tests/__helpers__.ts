import * as PrismaSDK from '@prisma/sdk'
import endent from 'endent'
import execa from 'execa'
import * as fs from 'fs-jetpack'
import { FSJetpack } from 'fs-jetpack/types'
import { DocumentNode, execute, printSchema } from 'graphql'
import { GraphQLClient } from 'graphql-request'
import { merge } from 'lodash'
import { core } from 'nexus'
import { AllNexusTypeDefs } from 'nexus/dist/core'
import { PackageJson, TsConfigJson } from 'type-fest'
import { generateRuntime } from '../src/generator/generate'
import * as ModelsGenerator from '../src/generator/models'
import { ModuleSpec } from '../src/generator/types'

export function createPrismaSchema({
  content,
  datasourceProvider = {
    provider: 'postgres',
    url: 'env("DB_URL")',
  },
  clientOutput,
  nexusPrisma = true,
}: {
  content: string
  datasourceProvider?: { provider: 'sqlite'; url: string } | { provider: 'postgres'; url: string }
  clientOutput?: string
  nexusPrisma?: boolean
}): string {
  return endent`
    datasource db {
      provider = "${datasourceProvider.provider}"
      url      = ${datasourceProvider.url}
    }

    generator client {
      provider = "prisma-client-js"${clientOutput ? `\noutput = ${clientOutput}` : ''}
    }

    ${
      nexusPrisma
        ? endent`
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
 * Given a Prisma schema and Nexus type definitions return a GraphQL schema.
 */
export async function integrationTest({
  name,
  datasourceSchema,
  apiSchema,
  datasourceSeed,
  apiClientQuery,
}: {
  name: string
  /**
   * Define a Prisma schema file
   *
   * Note datasource and generator blocks are taken care of automatically for you.
   */
  datasourceSchema: string
  /**
   * Define Nexus type definitions based on the Nexus Prisma configurations
   *
   * The configurations are typed as `any` to make them easy to work with. They ae not typesafe. Be careful.
   */
  apiSchema(nexusPrisma: any): AllNexusTypeDefs[]
  datasourceSeed: (prismaClient: any) => Promise<void>
  apiClientQuery: DocumentNode
}) {
  const dir = fs.tmpDir().cwd()
  const prismaClientImportId = `${dir}/client`
  const prismaSchemaContents = createPrismaSchema({
    content: datasourceSchema,
    datasourceProvider: {
      provider: 'sqlite',
      url: `"file:./db.sqlite"`,
    },
    nexusPrisma: false,
    clientOutput: `"./client"`,
  })

  fs.write(`${dir}/schema.prisma`, prismaSchemaContents)

  execa.commandSync(`yarn -s prisma db push --force-reset --schema ${dir}/schema.prisma`)

  const prismaClientPackage = require(prismaClientImportId)
  const prismaClient = new prismaClientPackage.PrismaClient()
  await datasourceSeed(prismaClient)

  const dmmf = await PrismaSDK.getDMMF({
    datamodel: prismaSchemaContents,
  })

  const nexusPrisma = ModelsGenerator.JS.createNexusTypeDefConfigurations(dmmf, {
    prismaClientImport: prismaClientImportId,
  }) as any

  const { schema } = await core.generateSchema.withArtifacts({
    types: apiSchema(nexusPrisma),
  })

  const resolution = await execute({
    contextValue: {
      prisma: prismaClient,
    },
    schema: schema,
    document: apiClientQuery,
  })

  await prismaClient.$disconnect()

  if (resolution.errors) {
    throw new Error(`GraphQL operation failed:\n\n  - ${resolution.errors.join('\n  - ')}`)
  }

  return {
    graphqlSchemaSDL: prepareGraphQLSDLForSnapshot(printSchema(schema)),
    resolution,
  }
}

function prepareGraphQLSDLForSnapshot(sdl: string): string {
  return '\n' + stripNexusQueryOk(sdl).trim() + '\n'
}

function stripNexusQueryOk(sdl: string): string {
  return sdl.replace(
    endent`
      type Query {
        ok: Boolean!
      }
    `,
    ''
  )
}

/**
 * Given a Prisma schema and Nexus type definitions return a GraphQL schema.
 */
export async function generateGraphqlSchemaSDL({
  prismaSchema,
  nexus,
}: {
  /**
   * Define a Prisma schema file
   *
   * Note datasource and generator blocks are taken care of automatically for you.
   */
  prismaSchema: string
  /**
   * Define Nexus type definitions based on the Nexus Prisma configurations
   *
   * The configurations are typed as `any` to make them easy to work with. They ae not typesafe. Be careful.
   */
  nexus(nexusPrisma: any): AllNexusTypeDefs[]
}) {
  const dmmf = await PrismaSDK.getDMMF({
    datamodel: createPrismaSchema({ content: prismaSchema }),
  })

  const nexusPrisma = ModelsGenerator.JS.createNexusTypeDefConfigurations(dmmf) as any

  const { schema } = await core.generateSchema.withArtifacts({
    types: nexus(nexusPrisma),
  })

  return prepareGraphQLSDLForSnapshot(printSchema(schema))
}

/**
 * TODO
 */
export async function generateModules(content: string): Promise<{ indexjs: string; indexdts: string }> {
  const prismaSchemaContents = createPrismaSchema({ content })

  const dmmf = await PrismaSDK.getDMMF({
    datamodel: prismaSchemaContents,
  })

  const [indexjs, indexdts] = generateRuntime(dmmf) as [ModuleSpec, ModuleSpec]

  return {
    indexdts: indexdts.content,
    indexjs: indexjs.content,
  }
}

export class TestProjectInfo {
  isReusing: boolean
  isReusingEnabled: boolean

  private settings = {
    infoFilPath: 'node_modules/.testProject/data.json',
  }

  constructor() {
    this.isReusingEnabled = Boolean(process.env.test_project_reuse)
    this.isReusing = this.isReusingEnabled && fs.exists(this.settings.infoFilPath) !== false
  }

  get(): { dir: string } | null {
    if (!process.env.test_project_reuse) return null
    return fs.read(this.settings.infoFilPath, 'json') ?? null
  }

  getOrSetGet(): { dir: string } {
    const testProjectInfo = this.get()
    if (testProjectInfo) {
      return testProjectInfo
    } else {
      const info = { dir: fs.tmpDir().cwd() }
      this.set(info)
      return info
    }
  }

  set(info: { dir: string }): void {
    fs.write(this.settings.infoFilPath, info, { jsonIndent: 2 })
  }
}

export function setupTestProject({
  packageJson,
  tsconfigJson,
}: {
  packageJson?: PackageJson
  tsconfigJson?: TsConfigJson
} = {}): TestProject {
  const tpi = new TestProjectInfo()

  /**
   * Allow reusing a test project directory. This can be helpful when debugging things.
   */
  let fs_ = tpi.isReusingEnabled ? fs.cwd(tpi.getOrSetGet().dir) : fs.tmpDir()

  fs_.write(
    'package.json',
    merge(
      {
        name: 'some-test-project',
        version: '1.0.0',
      },
      packageJson
    )
  )

  fs_.write(
    'tsconfig.json',
    merge(
      {
        compilerOptions: {
          strict: true,
          target: 'ES2018',
          module: 'CommonJS',
          moduleResolution: 'node',
          rootDir: 'src',
          outDir: 'build',
          esModuleInterop: true, // for ApolloServer b/c ws dep  :(
        },
        include: ['src'],
      } as TsConfigJson,
      tsconfigJson
    )
  )

  const api: TestProject = {
    fs: fs_,
    info: tpi,
    run(command, options) {
      return execa.commandSync(command, {
        reject: false,
        ...options,
        cwd: fs_.cwd(),
      })
    },
    runOrThrow(command, options) {
      return execa.commandSync(command, {
        ...options,
        cwd: fs_.cwd(),
      })
    },
    runAsync(command, options) {
      return execa.command(command, {
        ...options,
        cwd: fs_.cwd(),
      })
    },
    client: new GraphQLClient('http://localhost:4000'),
  }

  return api
}

export interface TestProject {
  fs: FSJetpack
  info: TestProjectInfo
  run(command: string, options?: execa.SyncOptions): execa.ExecaSyncReturnValue
  runAsync(command: string, options?: execa.SyncOptions): execa.ExecaChildProcess
  runOrThrow(command: string, options?: execa.SyncOptions): execa.ExecaSyncReturnValue
  client: GraphQLClient
}

export function assertBuildPresent() {
  if (fs.exists('../../dist')) {
    throw new Error(`Please build package before running this test`)
  }
}

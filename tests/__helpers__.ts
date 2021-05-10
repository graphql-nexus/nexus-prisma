import * as PrismaSDK from '@prisma/sdk'
import endent from 'endent'
import execa from 'execa'
import * as fs from 'fs-jetpack'
import { FSJetpack } from 'fs-jetpack/types'
import { printSchema } from 'graphql'
import { merge } from 'lodash'
import { core } from 'nexus'
import { AllNexusTypeDefs } from 'nexus/dist/core'
import { PackageJson, TsConfigJson } from 'type-fest'
import { generateRuntime } from '../src/generator/generate'
import * as ModelsGenerator from '../src/generator/models'
import { ModuleSpec } from '../src/generator/types'

export function createPrismaSchema(content: string): string {
  return endent`
    datasource db {
      provider = "postgresql"
      url      = env("DB_URL")
    }

    generator client {
      provider = "prisma-client-js"
    }

    generator nexusPrisma {
      provider = "nexus-prisma"
    }

    ${content}
  `
}

/**
 * Given a Prisma schema and Nexus type definitions return a GraphQL schema.
 */
export async function generateSchema({
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
  nexus(configurations: any): AllNexusTypeDefs[]
}) {
  const dmmf = await PrismaSDK.getDMMF({
    datamodel: createPrismaSchema(prismaSchema),
  })

  const configurations = ModelsGenerator.JS.createNexusTypeDefConfigurations(dmmf) as any

  const { schema } = await core.generateSchema.withArtifacts({
    types: nexus(configurations),
  })

  const printedSchema = printSchema(schema)

  return (
    '\n' +
    printedSchema
      .replace(
        endent`
          type Query {
            ok: Boolean!
          }
        `,
        ''
      )
      .trim() +
    '\n'
  )
}

export async function generateModules(content: string): Promise<{ indexjs: string; indexdts: string }> {
  const schema = createPrismaSchema(content)

  const dmmf = await PrismaSDK.getDMMF({
    datamodel: schema,
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
  }

  return api
}

export interface TestProject {
  fs: FSJetpack
  info: TestProjectInfo
  run(command: string, options?: execa.SyncOptions): execa.ExecaSyncReturnValue
  runAsync(command: string, options?: execa.SyncOptions): execa.ExecaChildProcess
  runOrThrow(command: string, options?: execa.SyncOptions): execa.ExecaSyncReturnValue
}

export function assertBuildPresent() {
  if (fs.exists('../../dist')) {
    throw new Error(`Please build package before running this test`)
  }
}

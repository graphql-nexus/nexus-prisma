import * as PrismaSDK from '@prisma/sdk'
import endent from 'endent'
import execa from 'execa'
import * as fs from 'fs-jetpack'
import { FSJetpack } from 'fs-jetpack/types'
import { merge } from 'lodash'
import { PackageJson, TsConfigJson } from 'type-fest'
import { generateRuntime } from '../src/generator/generate'
import { ModuleSpec } from '../src/generator/types'

export function createSchema(content: string): string {
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

export async function generate(content: string): Promise<{ indexjs: string; indexdts: string }> {
  const schema = createSchema(content)

  const dmmf = await PrismaSDK.getDMMF({
    datamodel: schema,
  })

  const [indexjs, indexdts] = generateRuntime(dmmf) as [ModuleSpec, ModuleSpec]

  return {
    indexdts: indexdts.content,
    indexjs: indexjs.content,
  }
}

export function setupTestProject({
  packageJson,
  tsconfigJson,
}: {
  packageJson?: PackageJson
  tsconfigJson?: TsConfigJson
} = {}): TestProject {
  const tmpdir = fs.tmpDir()

  tmpdir.write(
    'package.json',
    merge(
      {
        name: 'some-test-project',
        version: '1.0.0',
      },
      packageJson
    )
  )

  tmpdir.write(
    'tsconfig.json',
    merge(
      {
        compilerOptions: {
          strict: true,
          noEmit: true,
          target: 'ES2018',
          module: 'CommonJS',
          moduleResolution: 'Node',
        },
      },
      tsconfigJson
    )
  )

  const api: TestProject = {
    tmpdir,
    run(command, options) {
      return execa.commandSync(command, {
        reject: false,
        ...options,
        cwd: tmpdir.cwd(),
      })
    },
  }

  return api
}

export interface TestProject {
  tmpdir: FSJetpack
  run(command: string, options?: execa.SyncOptions): execa.ExecaSyncReturnValue
}

export function assertBuildPresent() {
  if (fs.exists('../../dist')) {
    throw new Error(`Please build package before running this test`)
  }
}

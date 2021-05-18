import execa from 'execa'
import * as fs from 'fs-jetpack'
import { FSJetpack } from 'fs-jetpack/types'
import { GraphQLClient } from 'graphql-request'
import { merge } from 'lodash'
import { PackageJson, TsConfigJson } from 'type-fest'

export interface TestProject {
  fs: FSJetpack
  info: TestProjectInfo
  run(command: string, options?: execa.SyncOptions): execa.ExecaSyncReturnValue
  runAsync(command: string, options?: execa.SyncOptions): execa.ExecaChildProcess
  runOrThrow(command: string, options?: execa.SyncOptions): execa.ExecaSyncReturnValue
  client: GraphQLClient
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

import { debug } from 'debug'
import * as Execa from 'execa'
import * as fs from 'fs-jetpack'
import { FSJetpack } from 'fs-jetpack/types'
import { GraphQLClient } from 'graphql-request'
import { merge } from 'lodash'
import { PackageJson, TsConfigJson } from 'type-fest'

const d = debug(`testProject`)

export interface TestProject {
  fs: FSJetpack
  info: TestProjectInfo
  run(command: string, options?: Execa.SyncOptions): Execa.ExecaSyncReturnValue
  runNpmScript(command: string, options?: Execa.SyncOptions): Execa.ExecaSyncReturnValue
  runAsync(command: string, options?: Execa.SyncOptions): Execa.ExecaChildProcess
  runOrThrow(command: string, options?: Execa.SyncOptions): Execa.ExecaSyncReturnValue
  runOrThrowNpmScript(command: string, options?: Execa.SyncOptions): Execa.ExecaSyncReturnValue
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

export interface FileSpec {
  filePath: string
  content: string
}

export function setupTestProject(
  params: {
    fixture?: string
    files?: {
      packageJson?: PackageJson
      tsconfigJson?: TsConfigJson
      other?: FileSpec[]
    }
  } = {}
): TestProject {
  const thisPackageName = `nexus-prisma`
  const tpi = new TestProjectInfo()
  /**
   * Allow reusing a test project directory. This can be helpful when debugging things.
   */
  const fs_ = tpi.isReusingEnabled ? fs.cwd(tpi.getOrSetGet().dir) : fs.tmpDir()

  const testProject: TestProject = {
    fs: fs_,
    info: tpi,
    run(command, options) {
      // console.log(`${command} ...`)
      return Execa.commandSync(command, {
        ...options,
        reject: false,
        cwd: fs_.cwd(),
      })
    },
    runNpmScript(command, options) {
      // console.log(`${command} ...`)
      return Execa.commandSync(`npm run --silent ${command}`, {
        ...options,
        reject: false,
        cwd: fs_.cwd(),
      })
    },
    runOrThrow(command, options) {
      // console.log(`${command} ...`)
      return Execa.commandSync(command, {
        ...options,
        cwd: fs_.cwd(),
      })
    },
    runOrThrowNpmScript(command, options) {
      // console.log(`${command} ...`)
      return Execa.commandSync(`npm run --silent ${command}`, {
        ...options,
        cwd: fs_.cwd(),
      })
    },
    runAsync(command, options) {
      // console.log(`${command} ...`)
      return Execa.command(command, {
        ...options,
        cwd: fs_.cwd(),
      })
    },
    client: new GraphQLClient('http://localhost:4000'),
  }

  if (params.fixture) {
    testProject.fs.copy(params.fixture, testProject.fs.cwd(), {
      overwrite: true,
    })
  } else {
    testProject.fs.write(
      'package.json',
      merge(
        {
          name: 'some-test-project',
          version: '1.0.0',
        },
        params.files?.packageJson
      )
    )

    testProject.fs.write(
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
        params.files?.tsconfigJson
      )
    )

    params.files?.other?.forEach((fileSpec) => testProject.fs.write(fileSpec.filePath, fileSpec.content))
  }

  if (testProject.info.isReusing) {
    d(`starting project setup cleanup for reuse`)
    testProject.fs.remove(`node_modules/${thisPackageName}`)
    testProject.runOrThrow(`yalc add ${thisPackageName}`)
    d(`done project setup cleanup for reuse`)
  } else {
    d(`starting project setup`)
    Execa.commandSync(`yalc publish --no-scripts`, { stdio: 'inherit' })
    testProject.runOrThrow(`yalc add ${thisPackageName}`, { stdio: 'inherit' })
    testProject.runOrThrow(`npm install --legacy-peer-deps`, { stdio: 'inherit' })
    d(`done project setup`)
  }

  return testProject
}

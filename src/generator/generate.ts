import { DMMF } from '@prisma/client/runtime'
import * as fs from 'fs-jetpack'
import * as Path from 'path'
import * as pkgup from 'pkg-up'
import { d } from '../helpers/debugNexusPrisma'
import { Gentime } from './gentime/settingsSingleton'
import * as ModelsGenerator from './models'
import { ModuleSpec } from './types'

const OUTPUT_SOURCE_DIR_ESM = getOutputSourceDir({ esm: true })
const OUTPUT_SOURCE_DIR_CJS = getOutputSourceDir({ esm: false })

/**
 * Find the output source directory. When using the Yalc workflow some additional hacking around is required.
 *
 * If the Yalc issue https://github.com/wclr/yalc/issues/156 is resolved then this should be as simple as
 * using __dirname.
 */
function getOutputSourceDir(params: { esm: boolean }): string {
  let outputSourceDir: string

  if (process.env.npm_package_dependencies_nexus_prisma === 'file:.yalc/nexus-prisma') {
    const packageJsonFilePath = pkgup.sync()
    if (packageJsonFilePath === null) {
      throw new Error(
        `Nexus Prisma error: Could not find the project root. Project root is the nearest ancestor directory to where this module is running (${__filename}) containing a package.json. Without this information Nexus Prisma does not know where to output its generated code.`
      )
    }
    outputSourceDir = Path.join(
      Path.dirname(packageJsonFilePath),
      params.esm ? 'node_modules/nexus-prisma/dist-esm/runtime' : 'node_modules/nexus-prisma/dist-cjs/runtime'
    )
  } else {
    /**
     * At this point in the code we don't know if the CLI running is the CJS or ESM version.
     * If it is the CJS version and we're doing an ESM build then we need to adjust the __dirname value.
     */
    outputSourceDir = Path.join(
      params.esm ? __dirname.replace('dist-cjs', 'dist-esm') : __dirname,
      '../runtime'
    )
  }

  d(`found outputSourceDir ${outputSourceDir}`)

  return outputSourceDir
}

/** Generate the Nexus Prisma runtime files and emit them into a "hole" in the internal package source tree. */
export function generateRuntimeAndEmit(dmmf: DMMF.Document, settings: Gentime.Settings): void {
  d('start generateRuntime with configuration %j', settings)

  d('start generateRuntime')

  if (process.env.NP_DEBUG) {
    fs.write('dmmf.json', dmmf)
  }

  const declarationSourceFile = ModelsGenerator.TS.createModuleSpec(dmmf, settings)
  process.stdout.write('1')
  process.stdout.write(JSON.stringify(settings.data.output))

  if (settings.data.output.directory === 'default') {
    // ESM

    const esmSourceFiles = [
      ModelsGenerator.JS.createModuleSpec({
        gentimeSettings: settings,
        esm: true,
        dmmf,
      }),
      declarationSourceFile,
    ]

    // fs.remove(OUTPUT_SOURCE_DIR_ESM)

    esmSourceFiles.forEach((sf) => {
      const filePath = Path.join(OUTPUT_SOURCE_DIR_ESM, sf.fileName)
      fs.remove(filePath)
      fs.write(filePath, sf.content)
      d(`did write ${filePath}`)
    })

    // CJS

    const cjsSourceFiles = [
      ModelsGenerator.JS.createModuleSpec({
        gentimeSettings: settings,
        esm: false,
        dmmf,
      }),
      declarationSourceFile,
    ]

    fs.remove(OUTPUT_SOURCE_DIR_CJS)

    cjsSourceFiles.forEach((sf) => {
      const filePath = Path.join(OUTPUT_SOURCE_DIR_CJS, sf.fileName)
      fs.remove(filePath)
      fs.write(filePath, sf.content)
      d(`did write ${filePath}`)
    })
  } else {
    const outputDir = settings.data.output.directory

    const sourceFiles = [
      ModelsGenerator.JS.createModuleSpec({
        gentimeSettings: settings,
        esm: settings.data.output?.moduleSystem === 'esm',
        dmmf,
      }),
      declarationSourceFile,
    ]

    // fs.remove(outputDir)

    sourceFiles.forEach((sf) => {
      const filePath = Path.join(outputDir, sf.fileName)
      // process.stderr.write(filePath)
      fs.remove(filePath)
      fs.write(filePath, sf.content)
      d(`did write ${filePath}`)
    })
  }

  d(`done writing all emitted files`)
}

/** Transform the given DMMF into JS source code with accompanying TS declarations. */
export function generateRuntime(dmmf: DMMF.Document, settings: Gentime.Settings): ModuleSpec[] {
  const sourceFiles: ModuleSpec[] = [
    ModelsGenerator.JS.createModuleSpec({
      gentimeSettings: settings,
      esm: true,
      dmmf,
    }),
    ModelsGenerator.JS.createModuleSpec({
      gentimeSettings: settings,
      esm: false,
      dmmf,
    }),
    ModelsGenerator.TS.createModuleSpec(dmmf, settings),
  ]

  return sourceFiles
}

import { DMMF } from '@prisma/client/runtime'
import * as fs from 'fs-jetpack'
import * as Path from 'path'
import * as pkgup from 'pkg-up'
import { d } from '../helpers/debugNexusPrisma'
import * as ModelsGenerator from './models'
import { ModuleSpec, Configuration } from './types'

const OUTPUT_SOURCE_DIR = getOutputSourceDir()

/** Generate the Nexus Prisma runtime files and emit them into a "hole" in the internal package source tree. */
export function generateRuntimeAndEmit(dmmf: DMMF.Document, configuration: Configuration): void {
  console.log(configuration)

  d('start generateRuntime')

  if (process.env.NP_DEBUG) {
    fs.write('dmmf.json', dmmf)
  }

  const sourceFiles: ModuleSpec[] = [
    ModelsGenerator.JS.createModuleSpec(),
    ModelsGenerator.TS.createModuleSpec(dmmf),
  ]

  fs.remove(OUTPUT_SOURCE_DIR)

  sourceFiles.forEach((sf) => {
    const filePath = Path.join(OUTPUT_SOURCE_DIR, sf.fileName)
    fs.remove(filePath)
    fs.write(filePath, sf.content)
    d(`did write ${filePath}`)
  })

  d(`done writing all emitted files`)
}

/** Transform the given DMMF into JS source code with accompanying TS declarations. */
export function generateRuntime(dmmf: DMMF.Document): ModuleSpec[] {
  const sourceFiles: ModuleSpec[] = [
    ModelsGenerator.JS.createModuleSpec(),
    ModelsGenerator.TS.createModuleSpec(dmmf),
  ]

  return sourceFiles
}

/**
 * Find the output source directory. When using the Yalc workflow some additional hacking around is required.
 *
 * If the Yalc issue https://github.com/wclr/yalc/issues/156 is resolved then this should be as simple as
 * using __dirname.
 */
function getOutputSourceDir(): string {
  let outputSourceDir: string

  if (process.env.npm_package_dependencies_nexus_prisma === 'file:.yalc/nexus-prisma') {
    const packageJsonFilePath = pkgup.sync()
    if (packageJsonFilePath === null) {
      throw new Error(
        `Nexus Prisma error: Could not find the project root. Project root is the nearest ancestor directory to where this module is running (${__filename}) containing a package.json. Without this information Nexus Prisma does not know where to output its generated code.`
      )
    }
    outputSourceDir = Path.join(Path.dirname(packageJsonFilePath), 'node_modules/nexus-prisma/dist/runtime')
  } else {
    outputSourceDir = Path.join(__dirname, '../runtime')
  }

  d(`found outputSourceDir ${outputSourceDir}`)

  return outputSourceDir
}

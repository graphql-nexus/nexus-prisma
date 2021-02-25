import { DMMF } from '@prisma/client/runtime'
import endent from 'endent'
import * as fs from 'fs-jetpack'
import * as Path from 'path'
import * as tsm from 'ts-morph'
import { d } from '../helpers/debugNexusPrisma'
import { SettingsData } from '../settings'
import { generateRuntimeNexusSource } from './nexus'
import { generateRuntimePrismaSource } from './prisma'

const OUTPUT_SOURCE_DIR = Path.join(__dirname, '../runtime')

/**
 * Generate the Nexus Prisma runtime.
 *
 * This will transform the given DMMF into JS source code with accompanying TS declarations. This will be
 * emitted into a "hole" in the internal package source tree.
 */
export function generateRuntime(dmmf: DMMF.Document, _settings: SettingsData): void {
  d('start generateRuntime')

  const generatedSources = [generateRuntimePrismaSource(dmmf), generateRuntimeNexusSource(dmmf)]

  d('done generateRuntime')

  d('start create TS project and emit transpiled JS')

  const tsProject = new tsm.Project({
    compilerOptions: {
      declaration: true,
      declarationMap: true,
    },
    useInMemoryFileSystem: true,
  })

  tsProject.createSourceFile(
    'index.ts',
    endent`
      export * as prisma from './prisma'
      export * as nexus from './nexus'
    `
  )

  generatedSources.forEach((generatedSource) => {
    tsProject.createSourceFile(generatedSource.fileName, generatedSource.content)
  })

  const emitResult = tsProject.emitToMemory()

  d('done create TS project and emit transpiled JS')

  d(`start writing emitted files to ${OUTPUT_SOURCE_DIR}`)

  emitResult.getFiles().forEach((emittedFile) => {
    const packageModulePath = Path.join(OUTPUT_SOURCE_DIR, emittedFile.filePath)
    fs.remove(packageModulePath)
    fs.write(packageModulePath, emittedFile.text)
    d(`done writing emitted file ${packageModulePath}`)
  })

  d(`done writing all emitting files`)
}

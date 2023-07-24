import * as fs from 'fs-jetpack'
import * as Path from 'path'

import { DMMF } from '@prisma/client/runtime'

import { d } from '../helpers/debugNexusPrisma'
import { Module } from './helpers/types'
import { ModuleGenerators } from './ModuleGenerators'
import { Settings } from './Settings'

export const OUTPUT_SOURCE_DIR = Path.join(__dirname, '../../../../node_modules/.nexus-prisma')

/** Generate the Nexus Prisma runtime files and emit them into a "hole" in the internal package source tree. */
export const generateRuntimeAndEmit = (dmmf: DMMF.Document, settings: Settings.Gentime.Manager): void => {
  d('start generateRuntime with configuration %j', settings)

  d('start generateRuntime')

  if (process.env.NP_DEBUG) {
    fs.write('dmmf.json', dmmf)
  }

  const declarationSourceFile = ModuleGenerators.TS.createModule(dmmf, settings)

  // comment this code because we generate only in on path
  /*  if (settings.data.output.directory === 'default') {
    // ESM

    const esmSourceFiles = [
      ModuleGenerators.JS.createModule({
        gentimeSettings: settings,
        esm: true,
        dmmf,
      }),
      declarationSourceFile,
    ]

    // fs.remove(OUTPUT_SOURCE_DIR_ESM)

    esmSourceFiles.forEach((sf) => {
      const filePath = Path.join(OUTPUT_SOURCE_DIR, sf.fileName)
      fs.remove(filePath)
      fs.write(filePath, sf.content)
      d(`did write ${filePath}`)
    })

    // CJS

    const cjsSourceFiles = [
      ModuleGenerators.JS.createModule({
        gentimeSettings: settings,
        esm: false,
        dmmf,
      }),
      declarationSourceFile,
    ]

    fs.remove(OUTPUT_SOURCE_DIR)

    cjsSourceFiles.forEach((sf) => {
      const filePath = Path.join(OUTPUT_SOURCE_DIR, sf.fileName)
      fs.remove(filePath)
      fs.write(filePath, sf.content)
      d(`did write ${filePath}`)
    })
  } else {*/
  const sourceFiles = [
    ModuleGenerators.JS.createModule({
      gentimeSettings: settings,
      esm: false,
      dmmf,
    }),
    declarationSourceFile,
  ]

  // fs.remove(outputDir)

  const outPutDir =
    settings.data.output.directory === 'default' ? OUTPUT_SOURCE_DIR : settings.data.output.directory

  d(`found outputSourceDir ${outPutDir}`)

  sourceFiles.forEach((sf) => {
    const filePath = Path.join(
      outPutDir,
      sf.fileName.endsWith('d.ts') ? `${settings.data.output.name}.d.ts` : `${settings.data.output.name}.js`,
    )
    fs.remove(filePath)
    fs.write(filePath, sf.content)
    d(`did write ${filePath}`)
  })
  //}

  d(`done writing all emitted files`)
}

/** Transform the given DMMF into JS source code with accompanying TS declarations. */
export const generateRuntime = (dmmf: DMMF.Document, settings: Settings.Gentime.Manager): Module[] => {
  return [
    ModuleGenerators.JS.createModule({
      gentimeSettings: settings,
      esm: true,
      dmmf,
    }),
    ModuleGenerators.JS.createModule({
      gentimeSettings: settings,
      esm: false,
      dmmf,
    }),
    ModuleGenerators.TS.createModule(dmmf, settings),
  ]
}

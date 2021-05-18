/**
 * Module Facades
 *
 * This script builds the modules that will be consumed publically. They front the actual code inside ./dist.
 * The problem being solved here is that it allows consumers to do e.g. this:
 *
 *     Import { ... } from 'nexus/testing'
 *
 * Instead of:
 *
 *     Import { ... } from 'nexus/dist/testing'
 *
 * Whatever modules are written here should be:
 *
 * 1. ignored in .gitignore.
 * 2. added to the package.json files array
 */

import * as fs from 'fs-jetpack'
import * as lo from 'lodash'
import * as os from 'os'
import * as path from 'path'
import { PackageJson } from 'type-fest'

generateModuleFacades([
  ['scalars.d.ts', "export * from './dist/entrypoints/scalars'"],
  ['scalars.js', "module.exports = require('./dist/entrypoints/scalars')"],

  ['generator.d.ts', "export * from './dist/entrypoints/generator'"],
  ['generator.js', "module.exports = require('./dist/entrypoints/generator')"],
])

function generateModuleFacades(facades: ModuleFacade[]) {
  // Write facade files

  for (const facade of facades) {
    fs.write(facade[0], facade[1] + os.EOL)
  }

  // Handle package.json files array

  const packageJsonPath = path.join(__dirname, '..', 'package.json')
  const packageJson = fs.read(packageJsonPath, 'json') as PackageJson

  packageJson.files = lo.uniq([...(packageJson.files ?? []), ...facades.map((facade) => facade[0])])

  const packageJsonString = JSON.stringify(packageJson, null, 2) + os.EOL

  fs.write(packageJsonPath, packageJsonString)
}

type ModuleFacade = [filePath: string, fileContents: string]

#!/usr/bin/env node

/** This script will be run by the prisma generator system. */

process.env.DEBUG_COLORS = 'true'
process.env.DEBUG_HIDE_DATE = 'true'

import { generatorHandler } from '@prisma/generator-helper'
import * as Path from 'path'
import { generateRuntimeAndEmit } from '../generator'
import { externalToInternalDmmf } from '../helpers/prismaExternalToInternalDMMF'

// todo by default error in ci and warn in local
// enforceValidPeerDependencies({
//   packageJson: require('../../package.json'),
// })

generatorHandler({
  onManifest() {
    return {
      defaultOutput: Path.join(__dirname, '../runtime'),
      prettyName: 'Nexus Prisma',
    }
  },
  // async required by interface
  // eslint-disable-next-line
  async onGenerate({ dmmf }) {
    const internalDMMF = externalToInternalDmmf(dmmf)
    console.log('created internal dmmf')
    generateRuntimeAndEmit(internalDMMF)
  },
})

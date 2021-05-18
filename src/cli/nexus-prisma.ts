#!/usr/bin/env node

/** This script will be run by the prisma generator system. */

process.env.DEBUG_COLORS = 'true'
process.env.DEBUG_HIDE_DATE = 'true'

import { generatorHandler } from '@prisma/generator-helper'
import * as Path from 'path'
import { generateRuntimeAndEmit } from '../generator'
import { loadUserGentimeSettings } from '../generator/gentime/settingsLoader'
import { Gentime } from '../generator/gentime/settingsSingleton'
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
    loadUserGentimeSettings()
    generateRuntimeAndEmit(internalDMMF, Gentime.settings)
    process.stdout.write(
      `You can now start using Prisma Client in your code. Reference: https://pris.ly/d/nexus-prisma\n`
    )
  },
})

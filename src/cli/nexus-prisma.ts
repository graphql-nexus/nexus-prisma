#!/usr/bin/env node

/** This script will be run by the prisma generator system. */

process.env.DEBUG_COLORS = 'true'
process.env.DEBUG_HIDE_DATE = 'true'
import { GeneratorConfig, generatorHandler } from '@prisma/generator-helper'
import * as Path from 'path'
import { generateRuntimeAndEmit } from '../generator'
import { loadUserGentimeSettings } from '../generator/gentime/settingsLoader'
import { Gentime } from '../generator/gentime/settingsSingleton'
import { d } from '../helpers/debugNexusPrisma'
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
  async onGenerate({ dmmf, otherGenerators }) {
    const prismaClientGenerator = otherGenerators.find((g) => g.provider.value === 'prisma-client-js')

    // TODO test showing this pretty error in action
    if (!prismaClientGenerator) {
      // TODO consider a prisma-client-less mode
      throw new Error(
        `Nexus Prisma cannot be used without Prisma Client. Please add it to your Prisma Schema file.`
      )
    }

    // WARNING: Make sure this logic comes before `loadUserGentimeSettings` below
    // otherwise we will overwrite the user's choice for this setting if they have set it.
    Gentime.settings.change({
      prismaClientImportId: getPrismaClientImportIdForItsGeneratorOutputConfig(prismaClientGenerator),
    })

    const internalDMMF = externalToInternalDmmf(dmmf)
    loadUserGentimeSettings()
    generateRuntimeAndEmit(internalDMMF, Gentime.settings)
    process.stdout.write(
      `You can now start using Nexus Prisma in your code. Reference: https://pris.ly/d/nexus-prisma\n`
    )
  },
})

/**
 * Hehlpers
 */

/**
 * Get the appropiate import ID for Prisma Client.
 *
 * When generator output is set to its default location within node_modules, then we return the import ID of just its npm moniker "@prisma/client".
 *
 * Othewise we return an import ID as an absolute path to the output location.
 */
function getPrismaClientImportIdForItsGeneratorOutputConfig(
  prismaClientGeneratorConfig: GeneratorConfig
): string {
  const prismaClientPackageMoniker = `@prisma/client`

  if (!prismaClientGeneratorConfig.output || !prismaClientGeneratorConfig.output.value) {
    return prismaClientPackageMoniker
  }

  if (prismaClientGeneratorConfig.output.value.endsWith(prismaClientPackageMoniker)) {
    const dirPrismaClientOutputWithoutTrailingNodeModulesMoniker = prismaClientGeneratorConfig.output.value.replace(
      new RegExp(`node_modules/${prismaClientPackageMoniker}$`),
      ''
    )
    const dirProjectForThisNexusPrisma = Path.join(__dirname, '../../../..')
    const dirDiff = Path.relative(
      dirPrismaClientOutputWithoutTrailingNodeModulesMoniker,
      dirProjectForThisNexusPrisma
    )

    d(`found prisma client/nexus prisma layout:`, {
      dirPrismaClientOutputWithoutTrailingNodeModulesMoniker,
      dirProjectForThisNexusPrisma,
      dirDiff,
    })

    if (dirDiff === '') {
      return prismaClientPackageMoniker
    }
  }

  return prismaClientGeneratorConfig.output.value
}

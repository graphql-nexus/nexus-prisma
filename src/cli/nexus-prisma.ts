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
 * Helpers
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
  const prismaClientDefaultOutput = Path.normalize(`/node_modules/@prisma/client`)

  if (!prismaClientGeneratorConfig.output || !prismaClientGeneratorConfig.output.value) {
    return prismaClientPackageMoniker
  }

  if (prismaClientGeneratorConfig.output.value.endsWith(prismaClientDefaultOutput)) {
    /**
     * Goal of this code:
     *
     * Find out if we can import Prisma Client by simplify specifying its moniker (@prisma/client).
     *
     * Why do we want to import by Moniker? Because it is a good default because it is what a user would
     * do in their own code. Also because not doing so has led to bugs https://github.com/prisma/nexus-prisma/issues/76.
     *
     * How this works:
     *
     * 1. Get the Prisma Client generatour output path minus the trailing node_moudles/@prisma/client (if present, it could be totally custom).
     *
     * Note that even if the user has not explicitly configured an output path in their PSL file by the time we get the geneator config from
     * Prisma generator system the output default has been supplied so we always have a value here to work with.
     *
     * 2. Get the Nexus Prisma package path on the user's machine by starting from this module and going four directories up. Four directories
     * up goes above the node_modules directory into their code.
     *
     * Note that we must go four up, not three up (which would be node_modules), because when using Yalc (used for development and E2E tests)
     * Nexus Prisma is placed into <project>/.yalc rather than <project>/node_modules. And therefore, the check we want to achieve here would
     * fail when it shouldn't.
     *
     * 3. With the two paths we check what the relative path between them is. If its an empty string, it means they are the same.
     *
     * Note this technique is better than string comparison because it guards against meaningless path difference details like windows vs posix.
     * We're not certain what path standard we'll get from Prisma for example and ideally we don't care. Path.relative function should let us not
     * care.
     */
    const dirPrismaClientOutputWithoutTrailingNodeModulesMoniker =
      prismaClientGeneratorConfig.output.value.replace(prismaClientDefaultOutput, '')

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

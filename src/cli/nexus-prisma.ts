#!/usr/bin/env node

/** This script will be run by the prisma generator system. */

import dindist from 'dindist'
import expandTilde from 'expand-tilde'
import * as Path from 'path'

import { GeneratorConfig, generatorHandler } from '@prisma/generator-helper'

import { generateRuntimeAndEmit } from '../generator'
import { Settings } from '../generator/Settings'
import { loadUserGentimeSettings, supportedSettingsModulePaths } from '../generator/Settings/Gentime/loader'
import { d } from '../helpers/debugNexusPrisma'
import { resolveGitHubActionsWindowsPathTilde } from '../helpers/utils'
import { renderCodeBlock, renderList, renderWarning } from '../lib/diagnostic'
import { PrismaUtils } from '../lib/prisma-utils'

process.env.DEBUG_COLORS = 'true'
process.env.DEBUG_HIDE_DATE = 'true'

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
  async onGenerate({ dmmf, otherGenerators, generator, schemaPath }) {
    const prismaClientGenerator = otherGenerators.find((g) => g.provider.value === 'prisma-client-js')

    // TODO test showing this pretty error in action
    if (!prismaClientGenerator) {
      // TODO consider a prisma-client-less mode
      throw new Error(
        `Nexus Prisma cannot be used without Prisma Client. Please add it to your Prisma Schema file.`
      )
    }

    if (generator.isCustomOutput) {
      if (!generator.output) {
        throw new Error(`Failed to read the custom output path.`)
      }

      Settings.Gentime.changeSettings({
        output: {
          directory: generator.output.value,
        },
      })

      // TODO capture this output in a test
      process.stdout.write(
        // prettier-ignore
        renderWarning({
          code: `nexus_prisma_prefer_config_file`,
          title: `It is preferred to use the Nexus Prisma configuration file to set the output directory.`,
          reason: `Using the Nexus Prisma configuration file gives you access to autocomplete and inline JSDoc documentation.`,
          consequence: `Your developer experience may be degraded.`,
          solution: `Create a configuration file in one of the following locations:\n\n${renderList(supportedSettingsModulePaths)}\n\nThen add the following code:\n\n${renderCodeBlock(dindist`
            import { settings } from 'nexus-prisma/generator'

            settings.change({
              output: '${generator.output.value}'
            })
        `)}`,
        }) + '\n'
      )
    }

    /**
     * Set the place to import Prisma Client from to be whatever has been set as the output in their PSL schema.
     *
     * WARNING: Make sure this logic comes before `loadUserGentimeSettings` below
     * otherwise we will overwrite the user's choice for this setting if they have set it.
     */
    Settings.Gentime.settings.change({
      prismaClientImportId: getPrismaClientImportIdForItsGeneratorOutputConfig(prismaClientGenerator),
    })

    /**
     * Loading the gentime settings will mutate the gentime settings assuming the user has
     * imported and used the gentime settings in their configuration module.
     */
    loadUserGentimeSettings()

    /**
     * If the output path is some explicit relative path then make it absolute relative to the Prisma Schema file directory.
     */
    if (
      Settings.Gentime.settings.data.output.directory !== 'default' &&
      !Path.isAbsolute(Settings.Gentime.settings.data.output.directory)
    ) {
      Settings.Gentime.settings.change({
        output: {
          directory: Path.join(Path.dirname(schemaPath), Settings.Gentime.settings.data.output.directory),
        },
      })
    }

    const prismaClientDmmf = PrismaUtils.externalToInternalDmmf(dmmf)

    generateRuntimeAndEmit(prismaClientDmmf, Settings.Gentime.settings)

    process.stdout.write(
      `You can now start using Nexus Prisma in your code. Reference: https://pris.ly/d/nexus-prisma\n`
    )
  },
})

/**
 * Helpers
 */

/**
 * Get the appropriate import ID for Prisma Client.
 *
 * When generator output is set to its default location within node_modules, then we return the import ID of just its npm moniker "@prisma/client".
 *
 * Otherwise we return an import ID as an absolute path to the output location.
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
     * 1. Get the Prisma Client generator output path minus the trailing node_modules/@prisma/client (if present, it could be totally custom).
     *
     * Note that even if the user has not explicitly configured an output path in their PSL file by the time we get the generator config from
     * Prisma generator system the output default has been supplied so we always have a value here to work with.
     *
     * 2. Get the Nexus Prisma package path on the user's machine by starting from this module and going four directories up. Four directories
     * up goes above the node_modules directory into their code.
     *
     * Note that we must go four up, not three up (which would be node_modules), because when using Yalc (used for development and E2E tests)
     * Nexus Prisma is placed into <project>/.yalc rather than <project>/node_modules. And therefore, the check we want to achieve here would
     * fail when it shouldn't.
     *
     * 3. With the two paths we check what the relative path between them is. If it's an empty string, it means they are the same.
     *
     * Note this technique is better than string comparison because it guards against meaningless path difference details like windows vs posix.
     * We're not certain what path standard we'll get from Prisma for example and ideally we don't care. Path.relative function should let us not
     * care.
     */
    const dirPrismaClientOutputWithoutTrailingNodeModulesMoniker = resolveGitHubActionsWindowsPathTilde(
      expandTilde(prismaClientGeneratorConfig.output.value.replace(prismaClientDefaultOutput, ''))
    )

    const dirProjectForThisNexusPrisma = resolveGitHubActionsWindowsPathTilde(
      expandTilde(Path.join(__dirname, '../../../..'))
    )

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

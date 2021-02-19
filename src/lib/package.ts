import kleur = require('kleur')
import * as Semver from 'semver'
import { PackageJson } from 'type-fest'

/**
 * Check that the given package's peer dependency requirements are met.
 *
 * NO-op if PEER_DEPENDENCY_CHECK envar is set to false or 0
 * NO-op if NO_PEER_DEPENDENCY_CHECK envar is set to true or 1
 */
export function validatePeerDependencies({ packageJson }: { packageJson: PackageJson }): void {
  if (['true', '1'].includes(process.env.NO_PEER_DEPENDENCY_CHECK ?? '')) return
  if (['false', '0'].includes(process.env.PEER_DEPENDENCY_CHECK ?? '')) return

  try {
    const name = packageJson.name ?? ''
    const peerDependencies = packageJson['peerDependencies'] ?? []

    for (const [pdName, _] of Object.entries(peerDependencies)) {
      checkPeerDependencyIsImportableOrFatal({ requiredBy: name, dependencyName: pdName })

      checkPeerDependencyRangeSatisfiedOrWarn({
        peerDependencyName: pdName,
        requireer: packageJson,
      })
    }
  } catch (e) {
    console.warn(
      renderWarning(`Something went wrong while trying to validate peer dependencies:\n\n${e.stack}`)
    )
  }
}

export function checkPeerDependencyRangeSatisfiedOrWarn({
  peerDependencyName,
  requireer,
}: {
  peerDependencyName: string
  requireer: PackageJson
}): void {
  const pdPackageJson = require(`${peerDependencyName}/package.json`) as PackageJson
  const pdVersion = pdPackageJson.version
  const pdVersionRangeSupported = requireer.peerDependencies?.[peerDependencyName]

  // npm enforces that package manifests have a valid "version" field so this case _should_ never happen under normal circumstances.
  if (!pdVersion) {
    console.warn(
      renderWarning(
        `Peer dependency validation check failed unexpectedly. ${requireer.name} requires peer dependency ${pdPackageJson.name}. No version info for ${pdPackageJson.name} could be found in its package.json thus preventing a check if its version satisfies the peer dependency version range.`
      )
    )
    return
  }

  if (!pdVersionRangeSupported) {
    console.warn(
      renderWarning(
        `Peer dependency validation check failed unexpectedly. ${requireer.name} apparently requires peer dependency ${pdPackageJson.name} yet ${pdPackageJson.name} is not listed in the peer dependency listing of ${requireer.name}.`
      )
    )
    return
  }

  if (Semver.satisfies(pdVersion, pdVersionRangeSupported)) {
    return
  }

  console.warn(
    renderWarning(
      `Peer dependency validation check failed: ${requireer.name}@${requireer.version} does not officially support ${pdPackageJson.name}@${pdPackageJson.version}. The officially supported range is: \`${pdVersionRangeSupported}\`. This could lead to undefined behaviors and bugs.`
    )
  )
}

/**
 * Ensure that some package has been installed as a peer dep by the user.
 */
export function checkPeerDependencyIsImportableOrFatal({
  dependencyName,
  requiredBy,
}: {
  dependencyName: string
  requiredBy: string
}): void {
  try {
    require(dependencyName)
  } catch (error: unknown) {
    if (!isModuleNotFoundError(error)) {
      console.warn(
        `Peer dependency check confirmed that ${dependencyName} requried by ${requiredBy} is importable however an error occured during import. This probably means something is wrong and your application will not work.\n\n${
          error instanceof Error ? error.stack : error
        }`
      )
      return
    }

    console.error(
      renderError(
        `${kleur.green(dependencyName)} is a peer dependency required by ${kleur.yellow(
          requiredBy
        )}. But you have not installed it into this project yet. Please run \`${kleur.green(
          renderPackageCommand(`add ${dependencyName}`)
        )}\`.`
      )
    )

    process.exit(1)
  }
}

function renderError(message: string): string {
  return `${kleur.red('ERROR:')} ${message}`
}

function renderWarning(message: string): string {
  return `${kleur.yellow('WARNING:')} ${message}`
}

function getPackageManagerBinName(): string {
  const userAgent = process.env.npm_config_user_agent || ''

  const packageManagerBinName = userAgent.includes('yarn') ? 'yarn' : 'npm'
  return packageManagerBinName
}

function renderPackageCommand(command: string): string {
  return `${getPackageManagerBinName()} ${command}`
}

function isModuleNotFoundError(error: any): error is Error {
  if (error instanceof Error && (error as any).code !== 'MODULE_NOT_FOUND') {
    return true
  }

  return false
}

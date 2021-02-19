import kleur = require('kleur')
import * as Semver from 'semver'
import { PackageJson } from 'type-fest'

type Failure =
  | { message: string; kind: 'peer_dep_not_installed' }
  | { message: string; kind: 'peer_dep_invalid_json'; error: unknown }
  | { message: string; kind: 'peer_dep_invalid_package_json' }
  | { message: string; kind: 'peer_dep_invalid_version' }
  | { message: string; kind: 'unexpected_error'; error: unknown }

export function enforceValidPeerDependencies({ packageJson }: { packageJson: PackageJson }): void {
  if (['true', '1'].includes(process.env.NO_PEER_DEPENDENCY_CHECK ?? '')) return
  if (['false', '0'].includes(process.env.PEER_DEPENDENCY_CHECK ?? '')) return

  const failure = validatePeerDependencies({ packageJson })

  if (failure) {
    console.log(failure.message)

    if ('error' in failure) {
      console.error(failure.error)
    }

    if (failure.kind === 'peer_dep_not_installed') {
      process.exit(1)
    }
  }
}

/**
 * Check that the given package's peer dependency requirements are met.
 *
 * When envar skipping enabled then:
 *
 *    1. NO-op if PEER_DEPENDENCY_CHECK envar is set to false or 0
 *    2. NO-op if NO_PEER_DEPENDENCY_CHECK envar is set to true or 1
 */
export function validatePeerDependencies({ packageJson }: { packageJson: PackageJson }): null | Failure {
  try {
    const peerDependencies = packageJson['peerDependencies'] ?? []

    for (const [pdName, _] of Object.entries(peerDependencies)) {
      const failure = validatePeerDependencyRangeSatisfied({
        peerDependencyName: pdName,
        requireer: packageJson,
      })

      if (failure) return failure
    }
  } catch (error) {
    return {
      kind: 'unexpected_error',
      message: renderWarning(`Something went wrong while trying to validate peer dependencies`),
      error,
    }
  }

  return null
}

export function validatePeerDependencyRangeSatisfied({
  peerDependencyName,
  requireer,
}: {
  peerDependencyName: string
  requireer: PackageJson
}): null | Failure {
  let pdPackageJson: PackageJson

  try {
    pdPackageJson = require(`${peerDependencyName}/package.json`) as PackageJson
  } catch (error: unknown) {
    if (!isModuleNotFoundError(error)) {
      return {
        kind: 'peer_dep_invalid_json',
        message: `Peer dependency check found ${peerDependencyName} requried by ${requireer.name} to be installed but encountered an error while reading its package.json.`,
        error,
      }
    }

    return {
      kind: 'peer_dep_not_installed',
      message: renderError(
        `${kleur.green(peerDependencyName)} is a peer dependency required by ${kleur.yellow(
          requireer.name ?? ''
        )}. But you have not installed it into this project yet. Please run \`${kleur.green(
          renderPackageCommand(`add ${peerDependencyName}`)
        )}\`.`
      ),
    }
  }

  const pdVersion = pdPackageJson.version
  const pdVersionRangeSupported = requireer.peerDependencies?.[peerDependencyName]

  // npm enforces that package manifests have a valid "version" field so this
  // case _should_ never happen under normal circumstances.
  if (!pdVersion) {
    return {
      kind: 'peer_dep_invalid_package_json',
      message: renderWarning(
        `Peer dependency validation check failed unexpectedly. ${requireer.name} requires peer dependency ${pdPackageJson.name}. No version info for ${pdPackageJson.name} could be found in its package.json thus preventing a check if its version satisfies the peer dependency version range.`
      ),
    }
  }

  if (!pdVersionRangeSupported) {
    console.warn(
      renderWarning(
        `Peer dependency validation check failed unexpectedly. ${requireer.name} apparently requires peer dependency ${pdPackageJson.name} yet ${pdPackageJson.name} is not listed in the peer dependency listing of ${requireer.name}.`
      )
    )
    return null
  }

  if (Semver.satisfies(pdVersion, pdVersionRangeSupported)) {
    return null
  }

  return {
    kind: 'peer_dep_invalid_version',
    message: renderWarning(
      `Peer dependency validation check failed: ${requireer.name}@${requireer.version} does not officially support ${pdPackageJson.name}@${pdPackageJson.version}. The officially supported range is: \`${pdVersionRangeSupported}\`. This could lead to undefined behaviors and bugs.`
    ),
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
  if (error instanceof Error && (error as any).code === 'MODULE_NOT_FOUND') {
    return true
  }

  return false
}

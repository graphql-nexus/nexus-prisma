import endent from 'endent'
import * as Semver from 'semver'
import { PackageJson } from 'type-fest'
import { d } from '../helpers/debugNexusPrisma'
import { detectProjectPackageManager, renderAddDeps } from './packageManager'
import kleur = require('kleur')

type Failure =
  // todo
  // | { message: string; kind: 'peer_dep_import_error' }
  // | { message: string; kind: 'peer_dep_missing_from_node_modules' }
  // | { message: string; kind: 'peer_dep_missing_from_package_json' }
  | { message: string; kind: 'peer_dep_not_installed' } // replace with peer_dep_missing_from_package_json
  | { message: string; kind: 'peer_dep_invalid_version' }
  | { message: string; kind: 'peer_dep_package_json_invalid' }
  | { message: string; kind: 'peer_dep_package_json_read_error'; error: unknown }
  | { message: string; kind: 'unexpected_error'; error: unknown }

export function enforceValidPeerDependencies({ packageJson }: { packageJson: PackageJson }): void {
  if (['true', '1'].includes(process.env.NO_PEER_DEPENDENCY_CHECK ?? '')) return
  if (['false', '0'].includes(process.env.PEER_DEPENDENCY_CHECK ?? '')) return
  d('validating peer dependencies')

  const failure = validatePeerDependencies({ packageJson })

  if (failure) {
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
 * 1. NO-op if PEER_DEPENDENCY_CHECK envar is set to false or 0
 * 2. NO-op if NO_PEER_DEPENDENCY_CHECK envar is set to true or 1
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
        kind: 'peer_dep_package_json_read_error',
        message: `Peer dependency check found ${peerDependencyName} requried by ${requireer.name} to be installed but encountered an error while reading its package.json.`,
        error,
      }
    }

    return {
      kind: 'peer_dep_not_installed',
      message: renderError(
        // prettier-ignore
        endent`
          ${kleur.green(peerDependencyName)} is a peer dependency required by ${kleur.yellow(requireer.name ?? '')}. But you have not installed it into this project yet. Please run \`${kleur.green(renderAddDeps(detectProjectPackageManager(),[peerDependencyName]))}\`.
        `
      ),
    }
  }

  const pdVersion = pdPackageJson.version
  const pdVersionRangeSupported = requireer.peerDependencies?.[peerDependencyName]

  // npm enforces that package manifests have a valid "version" field so this
  // case _should_ never happen under normal circumstances.
  if (!pdVersion) {
    return {
      kind: 'peer_dep_package_json_invalid',
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

function isModuleNotFoundError(error: any): error is Error {
  if (error instanceof Error && (error as any).code === 'MODULE_NOT_FOUND') {
    return true
  }

  return false
}

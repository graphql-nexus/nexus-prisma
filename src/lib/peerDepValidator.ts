import dedent from 'dindist'
import * as Semver from 'semver'
import { PackageJson } from 'type-fest'
import { d } from '../helpers/debugNexusPrisma'
import { isModuleNotFoundError } from '../helpers/utils'
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

export const envarSpecs = {
  NO_PEER_DEPENDENCY_CHECK: {
    name: `NO_PEER_DEPENDENCY_CHECK`,
    values: ['true', '1'],
  },
  PEER_DEPENDENCY_CHECK: {
    name: `PEER_DEPENDENCY_CHECK`,
    values: ['false', '0'],
  },
}

export function enforceValidPeerDependencies({ packageJson }: { packageJson: PackageJson }): void {
  if (
    envarSpecs.NO_PEER_DEPENDENCY_CHECK.values.includes(
      process.env[envarSpecs.NO_PEER_DEPENDENCY_CHECK.name] ?? ''
    )
  )
    return

  if (
    envarSpecs.PEER_DEPENDENCY_CHECK.values.includes(process.env[envarSpecs.PEER_DEPENDENCY_CHECK.name] ?? '')
  )
    return

  d('validating peer dependencies')

  const failure = validatePeerDependencies({ packageJson })

  if (failure) {
    console.error(failure.message)

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
  } catch (error: unknown) {
    const code = `unexpected_error`
    return {
      kind: code,
      message: renderWarning({
        title: `Something went wrong while trying to validate peer dependencies`,
        code,
        reason: error instanceof Error ? error.message : String(error),
        consequence: `There seems to be a bug so the regular correctness checks of the peer dep checker cannot be carried out now. You are on your own.`,
        solution: `Please report this issue.`,
      }),
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
    // Use the Node dep lookup algorithm
    // eslint-disable-next-line
    pdPackageJson = require(`${peerDependencyName}/package.json`) as PackageJson
  } catch (error: unknown) {
    if (!isModuleNotFoundError(error)) {
      return {
        kind: 'peer_dep_package_json_read_error',
        message: `Peer dependency check found ${peerDependencyName} requried by ${
          requireer.name ?? '<undefined>'
        } to be installed but encountered an error while reading its package.json.`,
        error,
      }
    }

    const code = 'peer_dep_not_installed'
    return {
      kind: code,
      message: renderError({
        title: `Peer dependency validation check failed.`,
        // prettier-ignore
        reason: dedent`${kleur.green(peerDependencyName)} is a peer dependency required by ${renderPackageJsonField(requireer,'name')}. But you have not installed it into this project yet.`,
        code,
        // prettier-ignore
        solution: `Please run \`${kleur.green(renderAddDeps(detectProjectPackageManager(),[peerDependencyName]))}\`.`,
        consequence: `Your project may not work correctly.`,
      }),
    }
  }

  const pdVersion = pdPackageJson.version
  const pdVersionRangeSupported = requireer.peerDependencies?.[peerDependencyName]

  // npm enforces that package manifests have a valid "version" field so this
  // case _should_ never happen under normal circumstances.
  if (!pdVersion) {
    const code = 'peer_dep_package_json_invalid'
    return {
      kind: code,
      message: renderWarning({
        title: `Peer dependency validation check failed unexpectedly.`,
        // prettier-ignore
        reason: `${renderPackageJsonField(requireer, 'name')} requires peer dependency ${renderPackageJsonField(pdPackageJson, 'name')}. No version info for ${renderPackageJsonField(pdPackageJson, 'name')} could be found in its package.json thus preventing a check if its version satisfies the peer dependency version range.`,
        consequence: `Peer dep validator checks cannot be carried out so you are on your own.`,
        code,
      }),
    }
  }

  if (!pdVersionRangeSupported) {
    const code = `unknown`
    console.warn(
      renderWarning({
        title: `Peer dependency validation check failed unexpectedly.`,
        // prettier-ignore
        reason: `${renderPackageJsonField(requireer, 'name')} apparently requires peer dependency ${renderPackageJsonField(pdPackageJson, 'name')} yet ${renderPackageJsonField(pdPackageJson, 'name')} is not listed in the peer dependency listing of ${renderPackageJsonField(requireer, 'name')}.`,
        consequence: `There seems to be a bug so the regular correctness checks of the peer dep checker cannot be carried out now. You are on your own. Please report this issue.`,
        code,
      })
    )
    return null
  }

  if (Semver.satisfies(pdVersion, pdVersionRangeSupported)) {
    return null
  }

  return {
    kind: 'peer_dep_invalid_version',
    message: renderWarning({
      title: `Peer dependency validation check failed`,
      // prettier-ignore
      reason: `${renderPackageJsonField(requireer, 'name')}@${renderPackageJsonField(requireer, 'version')} does not officially support ${renderPackageJsonField(pdPackageJson, 'name')}@${renderPackageJsonField(pdPackageJson, 'version')}. The officially supported range is: \`${pdVersionRangeSupported}\`.`,
      consequence: `This could lead to undefined behaviors and bugs.`,
      code: `peer_dep_invalid_version`,
    }),
  }
}

//prettier-ignore
const prettyPrintedDisableGuide = dedent`
  HOW TO DISABLE:
  
    You can disable this peer dependency check by setting one of two environment variables. Their specs are:

      ${envarSpecs.NO_PEER_DEPENDENCY_CHECK.name} = ${envarSpecs.NO_PEER_DEPENDENCY_CHECK.values.map(_=>`'${_}'`).join(` | `)}
      ${envarSpecs.PEER_DEPENDENCY_CHECK.name}    = ${envarSpecs.PEER_DEPENDENCY_CHECK.values.map(_=>`'${_}'`).join(` | `)}

    Examples:

      NO_PEER_DEPENDENCY_CHECK='true'
      NO_PEER_DEPENDENCY_CHECK='1'
      PEER_DEPENDENCY_CHECK='false'
      PEER_DEPENDENCY_CHECK='0'
`

type DiagnosticInfo = {
  title: string
  code: string
  reason: string
  consequence: string
  solution?: string
}

function renderError(params: DiagnosticInfo): string {
  const solution = params.solution ? `\n\nSOLUTION: ${params.solution}` : ''
  // prettier-ignore
  return `${kleur.red('ERROR:')} ${params.title}\n\nREASON: ${params.reason}\n\nCONSEQUENCE: ${params.consequence}${solution}\n\n${prettyPrintedDisableGuide}\n\nCODE: ${params.code}`
}

function renderWarning(params: DiagnosticInfo): string {
  const solution = params.solution ? `\n\nSOLUTION: ${params.solution}` : ''
  // prettier-ignore
  return `${kleur.yellow('WARNING:')} ${params.title}\n\nREASON: ${params.reason}\n\nCONSEQUENCE: ${params.consequence}${solution}\n\n${prettyPrintedDisableGuide}\n\nCODE: ${params.code}`
}

function renderPackageJsonField(packageJson: PackageJson, fieldName: keyof PackageJson): string {
  return kleur.yellow(
    packageJson[fieldName] === undefined ? `<${fieldName} is undefined>` : String(packageJson[fieldName])
  )
}

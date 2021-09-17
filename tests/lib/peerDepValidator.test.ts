import dedent from 'dindist'
import { merge, omit } from 'lodash'
import { PackageJson } from 'type-fest'
import { kont } from '../../../../prisma-labs/kont/dist-cjs'
import { envarSpecs } from '../../src/lib/peerDepValidator'
import { assertBuildPresent } from '../__helpers__/helpers'
import { project } from '../__providers__/project'
import { run } from '../__providers__/run'
import { tmpDir } from '../__providers__/tmpDir'

/** Setup */

const badJson = ';'

const requireer = {
  name: 'alpha',
}

const peerDep = {
  name: 'charlie',
}

const ctx = kont().useBeforeAll(tmpDir()).useBeforeAll(run()).useBeforeAll(project()).done()

beforeAll(() => {
  assertBuildPresent()

  // setup alpha dep that has peer dep requirements

  ctx.runOrThrow(`yarn add kleur semver tslib debug fs-jetpack dindist --production`)

  ctx.fs.write(`node_modules/${requireer.name}/package.json`, {
    name: requireer.name,
    version: '1.0.0',
    main: 'dist/index.js',
  })

  ctx.fs.copy(`${process.cwd()}/dist-cjs`, `${ctx.fs.cwd()}/node_modules/${requireer.name}/dist`)

  ctx.fs.write(
    'validatePeerDependencies.js',
    dedent`
      const assert = require('assert')
      const { validatePeerDependencies } = require('${requireer.name}/dist/lib/peerDepValidator')

      const packageJson = require('${requireer.name}/package.json')
      assert(packageJson)

      const failure = validatePeerDependencies({
        packageJson,
      })

      console.log(failure)
    `
  )

  ctx.fs.write(
    'enforceValidPeerDependencies.js',
    dedent`
      const assert = require('assert')
      const { enforceValidPeerDependencies } = require('${requireer.name}/dist/lib/peerDepValidator')

      const packageJson = require('${requireer.name}/package.json')
      assert(packageJson)

      enforceValidPeerDependencies({
        packageJson,
      })
    `
  )
})

beforeEach(() => {
  setupPeerDepRequirement({
    name: peerDep.name,
    range: '2.0.x',
    optional: false,
  })

  ctx.fs.remove(`node_modules/${peerDep.name}`)
})

/** Helpers */

function setupDep({
  name,
  version = '0.0.0',
  main = 'exports.hello = "world"',
  packageJson = (x) => x,
}: {
  name: string
  version?: string
  main?: string
  packageJson?: (defaultPackageJson: PackageJson) => PackageJson | string
}): void {
  const depdir = `node_modules/${name}`
  ctx.fs.write(`${depdir}/package.json`, packageJson({ name, version, main: './index.js' }))
  ctx.fs.write(`${depdir}/index.js`, main)
}

function setupPeerDepRequirement({
  name,
  range,
  optional,
}: {
  name: string
  range: string
  optional: boolean
}) {
  const old = ctx.fs.read(`node_modules/${requireer.name}/package.json`, 'json')
  ctx.fs.write(
    `node_modules/${requireer.name}/package.json`,
    merge(old, {
      peerDependencies: {
        [name]: range,
      },
      peerDependenciesMeta: {
        [name]: { optional },
      },
    })
  )
}

function runValidatePeerDependencies() {
  return ctx.runOrThrow('node validatePeerDependencies.js', {
    env: {
      ...process.env,
      FORCE_COLOR: '0',
    },
  })
}

function runEnforceValidPeerDependencies(params?: { env?: Record<string, string> }) {
  return ctx.runOrThrow('node enforceValidPeerDependencies.js', {
    env: {
      ...process.env,
      FORCE_COLOR: '0',
      ...params?.env,
    },
  })
}

/** Tests */

describe('ValidatePeerDependencies', () => {
  it('if peer dep missing, then returns failure', () => {
    expect(runValidatePeerDependencies().stdout).toMatchSnapshot()
  })

  it('if peer dep is optional, then no check is made against it', () => {
    setupPeerDepRequirement({
      name: peerDep.name,
      range: '2.0.x',
      optional: true,
    })
    expect(runValidatePeerDependencies().stdout).toMatchSnapshot()
  })

  it('if peer dep installed, but upon import JSON parsing fails somehow, then fails', () => {
    setupDep({
      name: peerDep.name,
      packageJson() {
        return badJson
      },
    })
    expect(runValidatePeerDependencies().stdout).toMatch(/peer_dep_package_json_read_error/)
  })

  it('if project peer dep version does not satisfy required range, then returns failure', () => {
    setupDep({
      name: peerDep.name,
      version: '1.0.0',
    })
    expect(runValidatePeerDependencies().stdout).toMatchSnapshot()
  })

  it('if peer dep version satisfies required range, then returns null', () => {
    setupDep({
      name: peerDep.name,
      version: '2.0.1',
    })
    expect(runValidatePeerDependencies().stdout).toMatchSnapshot()
  })

  it('if peer dep package.json missing version field, then returns failure', () => {
    setupDep({
      name: peerDep.name,
      version: '1.0.0',
      packageJson(packageJson) {
        return omit(packageJson, 'version')
      },
    })
    expect(runValidatePeerDependencies().stdout).toMatchSnapshot()
  })
})

describe('enforceValidPeerDependencies', () => {
  it(`if ${[envarSpecs.PEER_DEPENDENCY_CHECK.name]}=false|0 then no validation happens`, () => {
    // prettier-ignore
    expect(runEnforceValidPeerDependencies({ env: { [envarSpecs.PEER_DEPENDENCY_CHECK.name]: 'false' } }).stdout).toEqual(``)
    // prettier-ignore
    expect(runEnforceValidPeerDependencies({ env: { [envarSpecs.PEER_DEPENDENCY_CHECK.name]: '0' } }).stdout).toEqual(``)
  })

  it(`if ${[envarSpecs.NO_PEER_DEPENDENCY_CHECK.name]}=true|1 then no validation happens`, () => {
    // prettier-ignore
    expect(runEnforceValidPeerDependencies({ env: { [envarSpecs.NO_PEER_DEPENDENCY_CHECK.name]: 'true' } }).stdout).toEqual(``)
    // prettier-ignore
    expect(runEnforceValidPeerDependencies({ env: { [envarSpecs.NO_PEER_DEPENDENCY_CHECK.name]: '1' } }).stdout).toEqual(``)
  })

  it('if peer dependency is missing, than logs and process exits 1', () => {
    const result = runEnforceValidPeerDependencies()
    expect(result.exitCode).toEqual(1)
    expect(result.stderr).toMatchSnapshot()
  })
})

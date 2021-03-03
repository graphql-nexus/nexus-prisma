import endent from 'endent'
import * as execa from 'execa'
import * as fs from 'fs-jetpack'
import { FSJetpack } from 'fs-jetpack/types'
import { merge, omit } from 'lodash'
import { PackageJson } from 'type-fest'

/** Setup */

const badJson = ';'

const requireer = {
  name: 'alpha',
}

const peerDep = {
  name: 'charlie',
}

process.exit

let tmpdir: FSJetpack

beforeAll(() => {
  if (fs.exists('../../dist')) {
    throw new Error(`Please build package before running this test`)
  }

  tmpdir = fs.tmpDir()
  // console.log(tmpdir.cwd())

  // Setup project

  tmpdir.write('package.json', {
    name: 'myapp',
    version: '1.0.0',
    dependencies: {},
  })

  // setup alpha dep that has peer dep requirements

  execa.commandSync(`yarn add kleur semver endent --production`, { cwd: tmpdir.cwd() })

  tmpdir.write(`node_modules/${requireer.name}/package.json`, {
    name: requireer.name,
    version: '1.0.0',
    main: 'dist/index.js',
  })

  tmpdir.copy(`${process.cwd()}/dist`, `${tmpdir.cwd()}/node_modules/${requireer.name}/dist`)

  tmpdir.write(
    'validatePeerDependencies.js',
    endent`
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

  tmpdir.write(
    'enforceValidPeerDependencies.js',
    endent`
      const assert = require('assert')
      const { enforceValidPeerDependencies } = require('${requireer.name}/dist/lib/peerDepValidator')

      const packageJson = require('${requireer.name}/package.json')
      assert(packageJson)

      enforceValidPeerDependencies({
        packageJson,
      })
    `
  )

  setupPeerDepRequirement({
    name: peerDep.name,
    range: '2.0.x',
  })
})

beforeEach(() => {
  tmpdir.remove(`node_modules/${peerDep.name}`)
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
  tmpdir.write(`${depdir}/package.json`, packageJson({ name, version, main: './index.js' }))
  tmpdir.write(`${depdir}/index.js`, main)
}

function setupPeerDepRequirement({ name, range }: { name: string; range: string }) {
  const old = tmpdir.read(`node_modules/${requireer.name}/package.json`, 'json')
  tmpdir.write(
    `node_modules/${requireer.name}/package.json`,
    merge(old, { peerDependencies: { [name]: range } })
  )
}

function runValidatePeerDependencies() {
  return execa.commandSync('node validatePeerDependencies.js', {
    cwd: tmpdir.cwd(),
    env: {
      ...process.env,
      FORCE_COLOR: '0',
    },
  })
}

function runEnforceValidPeerDependencies(params?: { env?: Record<string, string> }) {
  return execa.commandSync('node enforceValidPeerDependencies.js', {
    cwd: tmpdir.cwd(),
    env: {
      ...process.env,
      FORCE_COLOR: '0',
      ...params?.env,
    },
    reject: false,
  })
}

/** Tests */

describe('ValidatePeerDependencies', () => {
  it('if peer dep missing, then returns failure', () => {
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
  it('if PEER_DEPENDENCY_CHECK=false|0 then no validation happens', () => {
    expect(runEnforceValidPeerDependencies({ env: { PEER_DEPENDENCY_CHECK: 'false' } }).stdout).toEqual(``)
    expect(runEnforceValidPeerDependencies({ env: { PEER_DEPENDENCY_CHECK: '0' } }).stdout).toEqual(``)
  })

  it('if NO_PEER_DEPENDENCY_CHECK=true|1 then no validation happens', () => {
    expect(runEnforceValidPeerDependencies({ env: { NO_PEER_DEPENDENCY_CHECK: 'true' } }).stdout).toEqual(``)
    expect(runEnforceValidPeerDependencies({ env: { NO_PEER_DEPENDENCY_CHECK: '1' } }).stdout).toEqual(``)
  })

  it('if peer dependency is missing, than logs and process exits 1', () => {
    const result = runEnforceValidPeerDependencies()
    expect(result.exitCode).toEqual(1)
    expect(result.stdout).toMatchSnapshot()
  })
})

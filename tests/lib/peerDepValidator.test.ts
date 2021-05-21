import dedent from 'dindist'
import * as Execa from 'execa'
import { merge, omit } from 'lodash'
import { PackageJson } from 'type-fest'
import { assertBuildPresent } from '../__helpers__/helpers'
import { setupTestProject, TestProject } from '../__helpers__/testProject'

/** Setup */

const badJson = ';'

const requireer = {
  name: 'alpha',
}

const peerDep = {
  name: 'charlie',
}

let testProject: TestProject

beforeAll(() => {
  assertBuildPresent()
  testProject = setupTestProject()

  // setup alpha dep that has peer dep requirements

  Execa.commandSync(`yarn add kleur semver tslib debug fs-jetpack dindist --production`, {
    cwd: testProject.fs.cwd(),
  })

  testProject.fs.write(`node_modules/${requireer.name}/package.json`, {
    name: requireer.name,
    version: '1.0.0',
    main: 'dist/index.js',
  })

  testProject.fs.copy(`${process.cwd()}/dist`, `${testProject.fs.cwd()}/node_modules/${requireer.name}/dist`)

  testProject.fs.write(
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

  testProject.fs.write(
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

  setupPeerDepRequirement({
    name: peerDep.name,
    range: '2.0.x',
  })
})

beforeEach(() => {
  testProject.fs.remove(`node_modules/${peerDep.name}`)
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
  testProject.fs.write(`${depdir}/package.json`, packageJson({ name, version, main: './index.js' }))
  testProject.fs.write(`${depdir}/index.js`, main)
}

function setupPeerDepRequirement({ name, range }: { name: string; range: string }) {
  const old = testProject.fs.read(`node_modules/${requireer.name}/package.json`, 'json')
  testProject.fs.write(
    `node_modules/${requireer.name}/package.json`,
    merge(old, { peerDependencies: { [name]: range } })
  )
}

function runValidatePeerDependencies() {
  return testProject.run('node validatePeerDependencies.js', {
    env: {
      ...process.env,
      FORCE_COLOR: '0',
    },
  })
}

function runEnforceValidPeerDependencies(params?: { env?: Record<string, string> }) {
  return testProject.run('node enforceValidPeerDependencies.js', {
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
    expect(result.stderr).toMatchSnapshot()
  })
})

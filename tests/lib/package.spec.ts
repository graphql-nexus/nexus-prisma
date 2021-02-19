import endent from 'endent'
import * as execa from 'execa'
import * as fs from 'fs-jetpack'
import { FSJetpack } from 'fs-jetpack/types'
import { merge, omit } from 'lodash'
import { PackageJson } from 'type-fest'

/**
 * setup
 */

const badJson = ';'

const requireer = {
  name: 'alpha',
}

const peerDep = {
  name: 'charlie',
}

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
    main: 'index.js',
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
    'index.js',
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

  setupPeerDepRequirement({
    name: peerDep.name,
    range: '2.0.x',
  })
})

/**
 * helpers
 */

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
  beforeEach(() => {
    fs.remove(depdir)
  })
}

function setupPeerDepRequirement({ name, range }: { name: string; range: string }) {
  const old = tmpdir.read(`node_modules/${requireer.name}/package.json`, 'json')
  tmpdir.write(
    `node_modules/${requireer.name}/package.json`,
    merge(old, { peerDependencies: { [name]: range } })
  )
}

function runPeerDepValidator(params?: { env?: Record<string, string> }) {
  return execa.commandSync('node index.js', {
    cwd: tmpdir.cwd(),
    env: {
      ...process.env,
      ...params?.env,
    },
  }).stdout
}

/**
 * tests
 */

it('if project is missing peer dependency an error is thrown', () => {
  expect(runPeerDepValidator()).toMatchInlineSnapshot(`
    "{
      kind: 'peer_dep_not_installed',
      message: '\\\\x1B[31mERROR:\\\\x1B[39m \\\\x1B[32mcharlie\\\\x1B[39m is a peer dependency required by \\\\x1B[33malpha\\\\x1B[39m. But you have not installed it into this project yet. Please run \`\\\\x1B[32myarn add charlie\\\\x1B[39m\`.'
    }"
  `)
})

it('if project has peer dep, but upon import it fails somehow, then a warning given', () => {
  setupDep({
    name: peerDep.name,
    packageJson() {
      return badJson
    },
  })
  expect(runPeerDepValidator()).toMatch(/peer_dep_invalid_json/)
})

it('if project peer dep version does not satisfy required range, then a warning given', () => {
  setupDep({
    name: peerDep.name,
    version: '1.0.0',
  })
  expect(runPeerDepValidator()).toMatchInlineSnapshot(`
    "{
      kind: 'peer_dep_invalid_version',
      message: '\\\\x1B[33mWARNING:\\\\x1B[39m Peer dependency validation check failed: alpha@1.0.0 does not officially support charlie@1.0.0. The officially supported range is: \`2.0.x\`. This could lead to undefined behaviors and bugs.'
    }"
  `)
})

it('if project peer dep version satisfies required range, then nothing happens', () => {
  setupDep({
    name: peerDep.name,
    version: '2.0.1',
  })
  expect(runPeerDepValidator()).toMatchInlineSnapshot(`"null"`)
})

it('if peer dep package.json missing version field, then a warning given', () => {
  setupDep({
    name: peerDep.name,
    version: '1.0.0',
    packageJson(packageJson) {
      return omit(packageJson, 'version')
    },
  })
  expect(runPeerDepValidator()).toMatchInlineSnapshot(`
    "{
      kind: 'peer_dep_invalid_package_json',
      message: '\\\\x1B[33mWARNING:\\\\x1B[39m Peer dependency validation check failed unexpectedly. alpha requires peer dependency charlie. No version info for charlie could be found in its package.json thus preventing a check if its version satisfies the peer dependency version range.'
    }"
  `)
})

// it('if PEER_DEPENDENCY_CHECK=false then no validation happens', () => {
//   expect(getResult({ env: { PEER_DEPENDENCY_CHECK: 'false' } })).toMatchInlineSnapshot(`"null"`)
// })

// it('if NO_PEER_DEPENDENCY_CHECK=true then no validation happens', () => {
//   expect(getResult({ env: { NO_PEER_DEPENDENCY_CHECK: 'true' } })).toMatchInlineSnapshot(`"null"`)
// })

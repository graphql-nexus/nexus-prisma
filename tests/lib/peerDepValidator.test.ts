import dedent from 'dindist'
import { konn, providers } from 'konn'
import { merge, omit } from 'lodash'
import { PackageJson } from 'type-fest'
import { envarSpecs } from '../../src/lib/peerDepValidator'
import { assertBuildPresent } from '../__helpers__/helpers'
import { project } from '../__providers__/project'
import { run } from '../__providers__/run'

/** Setup */

const badJson = ';'

const importer = {
  name: 'alpha',
}

const peerDep = {
  name: 'charlie',
}

const ctx = konn().useBeforeAll(providers.dir()).useBeforeAll(run()).useBeforeAll(project()).done()

beforeAll(async () => {
  assertBuildPresent()

  // setup alpha dep that has peer dep requirements

  await ctx.runPackagerCommandAsyncOrThrow(`add kleur semver tslib debug fs-jetpack dindist --production`)

  await ctx.fs.writeAsync(`node_modules/${importer.name}/package.json`, {
    name: importer.name,
    version: '1.0.0',
    main: 'dist/index.js',
  })

  await ctx.fs.copyAsync(`${process.cwd()}/dist-cjs`, `${ctx.fs.cwd()}/node_modules/${importer.name}/dist`)

  await ctx.fs.writeAsync(
    'validatePeerDependencies.js',
    dedent`
      const assert = require('assert')
      const { validatePeerDependencies } = require('${importer.name}/dist/lib/peerDepValidator')

      const packageJson = require('${importer.name}/package.json')
      assert(packageJson)

      const failure = validatePeerDependencies({
        packageJson,
      })

      console.log(failure)
    `
  )

  await ctx.fs.writeAsync(
    'enforceValidPeerDependencies.js',
    dedent`
      const assert = require('assert')
      const { enforceValidPeerDependencies } = require('${importer.name}/dist/lib/peerDepValidator')

      const packageJson = require('${importer.name}/package.json')
      assert(packageJson)

      enforceValidPeerDependencies({
        packageJson,
      })
    `
  )
})

beforeEach(async () => {
  await setupPeerDepRequirement({
    name: peerDep.name,
    range: '2.0.x',
    optional: false,
  })

  await ctx.fs.removeAsync(`node_modules/${peerDep.name}`)
})

/** Helpers */

async function setupDep({
  name,
  version = '0.0.0',
  main = 'exports.hello = "world"',
  packageJson = (x) => x,
}: {
  name: string
  version?: string
  main?: string
  packageJson?: (defaultPackageJson: PackageJson) => PackageJson | string
}): Promise<void> {
  const depDir = `node_modules/${name}`
  await ctx.fs.writeAsync(`${depDir}/package.json`, packageJson({ name, version, main: './index.js' }))
  await ctx.fs.writeAsync(`${depDir}/index.js`, main)
}

async function setupPeerDepRequirement({
  name,
  range,
  optional,
}: {
  name: string
  range: string
  optional: boolean
}) {
  const old = await ctx.fs.readAsync(`node_modules/${importer.name}/package.json`, 'json')
  await ctx.fs.writeAsync(
    `node_modules/${importer.name}/package.json`,
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

async function runValidatePeerDependencies() {
  return await ctx.runAsyncOrThrow('node validatePeerDependencies.js', {
    env: {
      ...process.env,
      FORCE_COLOR: '0',
    },
  })
}

async function runEnforceValidPeerDependencies(params?: { env?: Record<string, string> }) {
  return await ctx.runAsyncOrThrow('node enforceValidPeerDependencies.js', {
    env: {
      ...process.env,
      FORCE_COLOR: '0',
      ...params?.env,
    },
  })
}

/** Tests */

describe('ValidatePeerDependencies', () => {
  it('if peer dep missing, then returns failure', async () => {
    expect.assertions(1)
    expect((await runValidatePeerDependencies()).stdout).toMatchSnapshot()
  })

  it('if peer dep is optional, then no check is made against it', async () => {
    expect.assertions(1)
    await setupPeerDepRequirement({
      name: peerDep.name,
      range: '2.0.x',
      optional: true,
    })
    expect((await runValidatePeerDependencies()).stdout).toMatchSnapshot()
  })

  it('if peer dep installed, but upon import JSON parsing fails somehow, then fails', async () => {
    expect.assertions(1)
    await setupDep({
      name: peerDep.name,
      packageJson() {
        return badJson
      },
    })
    expect((await runValidatePeerDependencies()).stdout).toMatch(/peer_dep_package_json_read_error/)
  })

  it('if project peer dep version does not satisfy required range, then returns failure', async () => {
    expect.assertions(1)
    await setupDep({
      name: peerDep.name,
      version: '1.0.0',
    })
    expect((await runValidatePeerDependencies()).stdout).toMatchSnapshot()
  })

  it('if peer dep version satisfies required range, then returns null', async () => {
    expect.assertions(1)
    await setupDep({
      name: peerDep.name,
      version: '2.0.1',
    })
    expect((await runValidatePeerDependencies()).stdout).toMatchSnapshot()
  })

  it('if peer dep package.json missing version field, then returns failure', async () => {
    expect.assertions(1)
    await setupDep({
      name: peerDep.name,
      version: '1.0.0',
      packageJson(packageJson) {
        return omit(packageJson, 'version')
      },
    })
    expect((await runValidatePeerDependencies()).stdout).toMatchSnapshot()
  })
})

describe('enforceValidPeerDependencies', () => {
  it(`if ${[
    envarSpecs.PEER_DEPENDENCY_CHECK.name,
  ].toString()}=false|0 then no validation happens`, async () => {
    expect.assertions(2)
    expect(
      (await runEnforceValidPeerDependencies({ env: { [envarSpecs.PEER_DEPENDENCY_CHECK.name]: 'false' } }))
        .stdout
    ).toEqual(``)

    expect(
      (await runEnforceValidPeerDependencies({ env: { [envarSpecs.PEER_DEPENDENCY_CHECK.name]: '0' } }))
        .stdout
    ).toEqual(``)
  })

  it(`if ${[
    envarSpecs.NO_PEER_DEPENDENCY_CHECK.name,
  ].toString()}=true|1 then no validation happens`, async () => {
    expect.assertions(2)
    expect(
      (await runEnforceValidPeerDependencies({ env: { [envarSpecs.NO_PEER_DEPENDENCY_CHECK.name]: 'true' } }))
        .stdout
    ).toEqual(``)

    expect(
      (await runEnforceValidPeerDependencies({ env: { [envarSpecs.NO_PEER_DEPENDENCY_CHECK.name]: '1' } }))
        .stdout
    ).toEqual(``)
  })

  it('if peer dependency is missing, than logs and process exits 1', async () => {
    expect.assertions(1)
    await expect(runEnforceValidPeerDependencies()).rejects.toThrowErrorMatchingSnapshot()
  })
})

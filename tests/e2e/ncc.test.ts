import * as Execa from 'execa'
import { kont } from 'kont'
import { Providers } from 'kont/providers'
import * as Path from 'path'
import { project } from '../__providers__/project'

const ctx = kont()
  .useBeforeEach(Providers.Dir.create())
  .useBeforeEach(Providers.Run.create())
  .useBeforeEach(project())
  .done()

it('works with ncc', () => {
  // NOTE We disable peer dep check because in a bundler context it gets confused and reports false negatives.
  Execa.commandSync(`yalc publish --no-scripts`)
  ctx.fixture.use(Path.join(__dirname, 'fixtures/ncc'))
  ctx.runOrThrow(`yalc add ${ctx.thisPackageName}`)
  ctx.runOrThrow(`npm install --legacy-peer-deps`, { env: { PEER_DEPENDENCY_CHECK: 'false' } })
  ctx.runOrThrowPackageScript(`build`)

  // Remove this to ensure that when the ncc build is run in the next step
  // it is truly running independent of any node_modules.
  ctx.fs.remove('node_modules')

  const result = ctx.runOrThrowPackageScript(`start:dist`, { env: { PEER_DEPENDENCY_CHECK: 'false' } })

  expect(result.stdout).toMatchSnapshot()
})

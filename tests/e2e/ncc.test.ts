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
  ctx.fixture.use(Path.join(__dirname, 'fixtures/ncc'))

  ctx.runOrThrowPackageScript(`build`)

  // Remove this to ensure that when the ncc build is run in the next step
  // it is truly running independent of any node_modules.
  ctx.fs.remove('node_modules')

  const result = ctx.runOrThrowPackageScript(`start:dist`)

  expect(result.stdout).toMatchSnapshot()
})

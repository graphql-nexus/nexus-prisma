import { kont } from 'kont'
import * as Path from 'path'
import { project } from '../__providers__/project'
import { run } from '../__providers__/run'
import { tmpDir } from '../__providers__/tmpDir'

const ctx = kont().useBeforeEach(tmpDir()).useBeforeEach(run()).useBeforeEach(project()).done()

it('works with ncc', () => {
  ctx.fixture.use(Path.join(__dirname, 'fixtures/ncc'))

  ctx.runOrThrowNpmScript(`build`)

  // Remove this to ensure that when the ncc build is run in the next step
  // it is truly running independent of any node_modules.
  ctx.fs.remove('node_modules')

  const result = ctx.runOrThrowNpmScript(`start:dist`)

  expect(result.stdout).toMatchSnapshot()
})

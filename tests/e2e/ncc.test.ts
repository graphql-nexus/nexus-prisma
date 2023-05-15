import { konn, providers } from 'konn'
import * as Path from 'path'
import { stripEndingLines } from '../__helpers__/helpers'
import { project } from '../__providers__/project'
import { bindRunOrThrow } from './run-or-throw'

const ctx = konn()
  .useBeforeEach(providers.dir())
  .useBeforeEach(providers.run())
  .useBeforeEach(project())
  .done()

it('works with ncc', async () => {
  ctx.fixture.use(Path.join(__dirname, 'fixtures/ncc'))
  bindRunOrThrow(ctx)
  ctx.runOrThrow(`${Path.join(process.cwd(), 'node_modules/.bin/yalc')} add ${ctx.thisPackageName}`)
  ctx.runOrThrow(`npm install --legacy-peer-deps`, { env: { PEER_DEPENDENCY_CHECK: 'false' } })
  ctx.runOrThrowPackageScript(`build`)

  // Remove this to ensure that when the ncc build is run in the next step
  // it is truly running independent of any node_modules.
  ctx.fs.remove('node_modules')

  const result = ctx.runOrThrowPackageScript(`start:dist`, { env: { PEER_DEPENDENCY_CHECK: 'false' } })

  expect(stripEndingLines(result.stdout)).toMatchSnapshot()
})

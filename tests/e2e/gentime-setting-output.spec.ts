import { konn, providers } from 'konn'
import { Providers } from 'konn/providers'
import * as Path from 'path'
import { project } from '../__providers__/project'

const ctx = konn()
  .useBeforeEach(providers.dir())
  .useBeforeEach(providers.run())
  .useBeforeEach(project())
  .done()

it('gentime setting output: custom directory', () => {
  // ctx.fixture.use(Path.join(__dirname, 'fixtures/ncc'))
  // ctx.runOrThrow(`${Path.join(process.cwd(), 'node_modules/.bin/yalc')} add ${ctx.thisPackageName}`)
  // ctx.runOrThrow(`npm install --legacy-peer-deps`, { env: { PEER_DEPENDENCY_CHECK: 'false' } })
  // ctx.runOrThrowPackageScript(`build`)
  // // Remove this to ensure that when the ncc build is run in the next step
  // // it is truly running independent of any node_modules.
  // ctx.fs.remove('node_modules')
  // const result = ctx.runOrThrowPackageScript(`start:dist`, { env: { PEER_DEPENDENCY_CHECK: 'false' } })
  // expect(result.stdout).toMatchSnapshot()
})

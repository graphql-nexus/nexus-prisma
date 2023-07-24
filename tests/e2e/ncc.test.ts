import { konn, providers } from 'konn'
import * as Path from 'path'
import { stripEndingLines } from '../__helpers__/helpers'
import { project } from '../__providers__/project'
import { monitorAsyncMethod, run } from '../__providers__/run'

const ctx = konn().useBeforeEach(providers.dir()).useBeforeEach(run()).useBeforeEach(project()).done()

it(
  'works with ncc',
  async () => {
    expect.assertions(1)
    await ctx.fixture.useAsync(Path.join(__dirname, 'fixtures/ncc'))
    await ctx.runAsyncOrThrow(
      `${Path.join(process.cwd(), 'node_modules/.bin/yalc')} add ${ctx.thisPackageName}`,
    )
    await monitorAsyncMethod(
      () =>
        ctx.runPackagerCommandAsyncOrThrow('install --legacy-peer-deps --prefer-offline', {
          env: { PEER_DEPENDENCY_CHECK: 'false' },
        }),
      { retry: 3, timeout: 90 * 1000 },
    )
    await ctx.runPackagerCommandAsyncOrThrow('build')
    // Remove this to ensure that when the ncc build is run in the next step
    // it is truly running independent of any node_modules.
    await ctx.fs.removeAsync('node_modules')
    const result = await ctx.runPackagerCommandAsyncOrThrow('run --silent start:dist', {
      env: { PEER_DEPENDENCY_CHECK: 'false' },
    })
    expect(stripEndingLines(result.stdout)).toMatchSnapshot()
  },
  320 * 1000,
)

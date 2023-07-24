import * as Path from 'path'
import dindist from 'dindist'
import { konn, providers } from 'konn'
import 'ts-replace-all'
import { project } from '../__providers__/project'
import { monitorAsyncMethod, run } from '../__providers__/run'
import { createPrismaSchema } from '../__helpers__/helpers'

const ctx = konn().useBeforeAll(providers.dir()).useBeforeAll(run()).useBeforeAll(project()).done()

beforeAll(async () => {
  await ctx.fixture.useAsync(Path.join(__dirname, 'fixtures/ts-node-unused'))
  await ctx.fs.writeAsync(
    `prisma/schema.prisma`,
    createPrismaSchema({
      content: dindist`
        model Foo {
          id  String  @id
        }
      `,
    })
  )
  await ctx.runAsyncOrThrow(
    `${Path.join(process.cwd(), 'node_modules/.bin/yalc')} add ${ctx.thisPackageName}`
  )
  await monitorAsyncMethod(
    () =>
      ctx.runPackagerCommandAsyncOrThrow('install --legacy-peer-deps --prefer-offline', {
        env: { PEER_DEPENDENCY_CHECK: 'false' },
      }),
    { retry: 3, timeout: 90 * 1000 }
  )

  return ctx
}, 320 * 1000)

it('when project does not have ts-node installed nexus-prisma generator still generates if there are no TS generator config files present', async () => {
  expect.assertions(1)
  const result = await ctx.runPackagerCommandAsyncOrThrow('run --silent build')
  expect(normalizeGeneratorOutput(result.stdout)).toMatchSnapshot()
})

const normalizeGeneratorOutput = (output: string) =>
  output
    .replaceAll(/(\d+|\d+(\.\d+))(ms|s)/g, '<SOME TIME><unit>')
    .replaceAll(/ to .* in /g, ' to <SOME PATH> in ')
    .replaceAll(/loaded from.*/g, 'loaded from <SOME PATH>')
    .replaceAll(/Generated Prisma Client \(.*\)/g, 'Generated Prisma Client (<SOME VERSION>)')

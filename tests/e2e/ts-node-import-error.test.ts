import dindist from 'dindist'
import { konn, providers } from 'konn'
import 'ts-replace-all'
import * as Path from 'path'
import { createPrismaSchema } from '../__helpers__/helpers'
import { project } from '../__providers__/project'
import { monitorAsyncMethod, run } from '../__providers__/run'

const ctx = konn().useBeforeEach(providers.dir()).useBeforeEach(run()).useBeforeEach(project()).done()

it(
  'when project does not have ts-node installed nexus-prisma generator still generates if there are no TS generator config files present',
  async () => {
    expect.assertions(2)
    await ctx.fixture.useAsync(Path.join(__dirname, 'fixtures/ts-node-import-error'))
    await ctx.fs.writeAsync(
      `prisma/schema.prisma`,
      createPrismaSchema({
        content: dindist`
      model Foo {
        id  String  @id
      }
    `,
      }),
    )

    await ctx.fs.writeAsync(
      'prisma/nexus-prisma.ts',
      dindist`
      throw new Error('Oops, something unexpected happened.')
    `,
    )

    await ctx.runAsyncOrThrow(`yalc add ${ctx.thisPackageName}`)
    await monitorAsyncMethod(
      () =>
        ctx.runPackagerCommandAsyncOrThrow('install --legacy-peer-deps --prefer-offline', {
          env: { PEER_DEPENDENCY_CHECK: 'false' },
        }),
      { retry: 3, timeout: 90 * 1000 },
    )

    const result = await ctx.runPackagerCommandAsyncGracefully('run --silent build')

    expect(normalizeGeneratorOutput(result.stderr)).toMatchSnapshot('stderr')
    expect(normalizeGeneratorOutput(result.stdout)).toMatchSnapshot('stdout')
  },
  320 * 1000,
)

const normalizeGeneratorOutput = (output: string) =>
  output
    .replaceAll(/(\d+|\d+(\.\d+))(ms|s)/g, '<SOME TIME><unit>')
    .replaceAll(/ to .* in /g, ' to <SOME PATH> in ')
    .replaceAll(/loaded from.*/g, 'loaded from <SOME PATH>')
    .replaceAll(/Error: Cannot find module/g, 'Cannot find module')
    .replaceAll(/Generated Prisma Client \(.*\)/g, 'Generated Prisma Client (<SOME VERSION>)')
    // https://regex101.com/r/r2wR1Y/2
    .replaceAll(/Require stack:(?:(?:\n\s*- .*)(?:\n +at .* \(.*\))*)+/g, 'Require stack:\n- <SOME STACK>')
    // TODO: Temporary fix for
    // https://github.com/npm/cli/issues/4980#issuecomment-1145334203.
    // Remove when resolved.
    .replace(
      /npm WARN config global `--global`, `--local` are deprecated. Use `--location=global` instead.\n/,
      '',
    )

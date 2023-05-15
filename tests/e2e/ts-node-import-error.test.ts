import dindist from 'dindist'
import { konn, providers } from 'konn'
import 'ts-replace-all'
import * as Path from 'path'
import { createPrismaSchema } from '../__helpers__/helpers'
import { project } from '../__providers__/project'
import { bindRunOrThrow } from './run-or-throw'

const ctx = konn()
  .useBeforeEach(providers.dir())
  .useBeforeEach(providers.run())
  .useBeforeEach(project())
  .done()

it('when project does not have ts-node installed nexus-prisma generator still generates if there are no TS generator config files present', async () => {
  ctx.fixture.use(Path.join(__dirname, 'fixtures/ts-node-import-error'))
  ctx.fs.write(
    `prisma/schema.prisma`,
    createPrismaSchema({
      content: dindist`
      model Foo {
        id  String  @id
      }
    `,
    })
  )

  ctx.fs.write(
    'prisma/nexus-prisma.ts',
    dindist`
      throw new Error('Oops, something unexpected happened.')
    `
  )
  bindRunOrThrow(ctx)
  ctx.runOrThrow(`yalc add ${ctx.thisPackageName}`)
  await ctx.runAsync(`yarn install --legacy-peer-deps`, { env: { PEER_DEPENDENCY_CHECK: 'false' } })

  const result = await ctx.runPackageScript(`build`)

  expect(normalizeGeneratorOutput(result.stderr)).toMatchSnapshot('stderr')
  expect(normalizeGeneratorOutput(result.stdout)).toMatchSnapshot('stdout')
}, 5*60*1000)

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
      ''
    )

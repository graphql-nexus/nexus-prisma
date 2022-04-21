import dindist from 'dindist'
import { konn, providers } from 'konn'
import 'ts-replace-all'
import { createPrismaSchema } from '../__helpers__/helpers'
import { project } from '../__providers__/project'

const ctx = konn()
  .useBeforeEach(providers.dir())
  .useBeforeEach(providers.run())
  .useBeforeEach(project())
  .done()

it('when project does not have ts-node installed nexus-prisma generator still generates if there are no TS generator config files present', async () => {
  ctx.packageJson.merge({
    scripts: {
      build: 'prisma generate',
    },
    dependencies: {
      '@prisma/client': '3.12',
      graphql: '15.5.1',
      nexus: '1.1.0',
      prisma: '3.12',
    },
  })

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

  ctx.runOrThrow(`yalc add ${ctx.thisPackageName}`)
  ctx.runOrThrow(`npm install --legacy-peer-deps`, { env: { PEER_DEPENDENCY_CHECK: 'false' } })

  const result = await ctx.runPackageScript(`build`)

  expect(normalizeGeneratorOutput(result.stderr)).toMatchSnapshot('stderr')
  expect(normalizeGeneratorOutput(result.stdout)).toMatchSnapshot('stdout')
})

const normalizeGeneratorOutput = (output: string) =>
  output
    .replaceAll(/\d+(ms|s)/g, '<SOME TIME>$1')
    .replaceAll(/ to .* in /g, ' to <SOME PATH> in ')
    .replaceAll(/loaded from.*/g, 'loaded from <SOME PATH>')
    .replaceAll(/Generated Prisma Client \(.*\)/g, 'Generated Prisma Client (<SOME VERSION>)')
    // https://regex101.com/r/r2wR1Y/2
    .replaceAll(/Require stack:(?:(?:\n\s*- .*)(?:\n +at .* \(.*\))*)+/g, 'Require stack:\n- <SOME STACK>')

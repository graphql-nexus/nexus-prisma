import dindist from 'dindist'
import { kont } from 'kont'
import 'ts-replace-all'
import { createPrismaSchema } from '../__helpers__/testers'
import { project } from '../__providers__/project'
import { run } from '../__providers__/run'
import { tmpDir } from '../__providers__/tmpDir'

const ctx = kont()
  .useBeforeAll(tmpDir())
  .useBeforeAll(run())
  .useBeforeAll(project())
  .beforeAll((ctx) => {
    ctx.packageJson.merge({
      scripts: {
        build: 'prisma generate',
      },
      dependencies: {
        '@prisma/client': '2.30',
        graphql: '15.5.1',
        nexus: '1.1.0',
        prisma: '2.30',
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
    return ctx
  })
  .done()

it('when project does not have ts-node installed nexus-prisma generator still generates if there are no TS generator config files present', async () => {
  const result = await ctx.runOrThrowNpmScript(`build`)
  expect(normalizeGeneratorOutput(result.stdout)).toMatchSnapshot()
})

const normalizeGeneratorOutput = (output: string) =>
  output
    .replaceAll(/\d+ms/g, '<SOME TIME>ms')
    .replaceAll(/ to .* in /g, ' to <SOME PATH> in ')
    .replaceAll(/loaded from.*/g, 'loaded from <SOME PATH>')
    .replaceAll(/Generated Prisma Client \(.*\)/g, 'Generated Prisma Client (<SOME VERSION>)')

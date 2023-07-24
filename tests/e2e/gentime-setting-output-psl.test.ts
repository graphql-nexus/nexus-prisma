import { konn, providers } from 'konn'
import * as Path from 'path'
import { stripEndingLines } from '../__helpers__/helpers'
import { project } from '../__providers__/project'
import { monitorAsyncMethod, run } from '../__providers__/run'

const ctx = konn().useBeforeEach(providers.dir()).useBeforeEach(run()).useBeforeEach(project()).done()

it('gentime setting output: custom directory', async () => {
  expect.assertions(1)
  await ctx.fixture.useAsync(Path.join(__dirname, 'fixtures/basic'))
  await ctx.fs.removeAsync('prisma/nexus-prisma.ts')
  await ctx.fs.writeAsync(
    'prisma/schema.prisma',
    `
      datasource db {
        provider = "sqlite"
        url      = "file:./db.sqlite"
      }

      generator client {
        provider = "prisma-client-js"
      }

      generator nexusPrisma {
        provider = "nexus-prisma"
        // Testing this.
        output   = "../generated/nexus-prisma"
      }

      model Foo {
        id String @id @default(cuid())
      }
    `
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
  await ctx.runPackagerCommandAsyncOrThrow('prisma generate')
  const result = await ctx.runPackagerCommandAsyncOrThrow('run --silent dev', {
    env: { PEER_DEPENDENCY_CHECK: 'false' },
  })
  expect(stripEndingLines(result.stdout)).toMatchSnapshot()
})

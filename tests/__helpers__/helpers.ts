import dedent from 'dindist'
import * as fs from 'fs-jetpack'
import * as Path from 'path'

export const timeoutRace = async <T>(
  values: Iterable<T | PromiseLike<T>>,
  timeout: number
): Promise<Awaited<T> | 'timeout'> => {
  let timeoutHandle: NodeJS.Timeout | undefined

  const result = await Promise.race<'timeout' | T>([
    ...values,
    new Promise((res) => {
      timeoutHandle = setTimeout(() => res('timeout'), timeout)
    }),
  ])

  if (result !== 'timeout' && timeoutHandle) {
    clearTimeout(timeoutHandle)
  }
  return result
}

export function assertBuildPresent() {
  if (fs.exists(Path.join(__dirname, '../../dist-esm')) === false)
    throw new Error(`Please run build ESM before running this test`)

  if (fs.exists(Path.join(__dirname, '../../dist-cjs')) === false)
    throw new Error(`Please run build CJS before running this test`)
}

export const createConsoleLogCapture = () => {
  const consoleLog = console.log
  const logs: string[] = []
  const api = {
    start() {
      console.log = (value) => {
        logs.push(value)
      }
    },
    stop() {
      console.log = consoleLog
    },
    logs,
  }
  return api
}

/**
 * Create the contents of a Prisma Schema file.
 */
export const createPrismaSchema = ({
  content,
  datasourceProvider,
  clientOutput,
  nexusPrisma,
}: {
  content: string
  /**
   * The datasource provider block. Defaults to postgres provider with DB_URL envar lookup.
   */
  datasourceProvider?: { provider: 'sqlite'; url: string } | { provider: 'postgres'; url: string }
  /**
   * Specify the prisma client generator block output configuration. By default is unspecified and uses the Prisma client generator default.
   */
  clientOutput?: string
  /**
   * Should the Nexus Prisma generator block be added.
   *
   * @default true
   */
  nexusPrisma?: boolean
}): string => {
  const outputConfiguration = clientOutput ? `\n  output = "${clientOutput}"` : ''
  const nexusPrisma_ = nexusPrisma ?? true
  const datasourceProvider_ = datasourceProvider
    ? {
        ...datasourceProvider,
        url: datasourceProvider.url.startsWith('env')
          ? datasourceProvider.url
          : `"${datasourceProvider.url}"`,
      }
    : {
        provider: 'postgres',
        url: 'env("DB_URL")',
      }

  return dedent`
    datasource db {
      provider = "${datasourceProvider_.provider}"
      url      = ${datasourceProvider_.url}
    }

    generator client {
      provider = "prisma-client-js"${outputConfiguration}
    }

    ${
      nexusPrisma_
        ? dedent`
            generator nexusPrisma {
              provider = "nexus-prisma"
            }
          `
        : ``
    }

    ${content}
  `
}

export const prepareGraphQLSDLForSnapshot = (sdl: string): string => {
  return '\n' + stripNexusQueryOk(sdl).trim() + '\n'
}

export const stripNexusQueryOk = (sdl: string): string => {
  return sdl.replace(
    dedent`
      type Query {
        ok: Boolean!
      }
    `,
    ''
  )
}

export const stripEndingLines = (s?: string) => s?.replace(/\n+$/, '')

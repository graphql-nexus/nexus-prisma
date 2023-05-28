import * as Execa from 'execa'
import { provider, Provider } from 'konn'
import { Providers } from 'konn/providers'
import { getPackageManager } from '../__helpers__/packageManager'

// import { Dir } from '../Dir'

export type Params = {
  /**
   * Which package manager should `runPackageScript` use?
   *
   * @default `'npm'`
   */
  packageManager?: 'npm' | 'yarn' | 'pnpm'
  /**
   * Enable debug mode.
   *
   * When debug mode is enabled then commands will attach to the parent process stdio. This can be helpful
   * when trying to see what a child process is doing via its emitted logs, errors, etc.
   *
   * @default false
   */
  debug?: boolean
}

export type Needs = Partial<Providers.Dir.Contributes>
type RunOptions = Execa.SyncOptions

export type Contributes = {
  // runOrThrow(command: string, options?: RunOptions): Execa.ExecaSyncReturnValue
  // runGracefully(command: string, options?: RunOptions): Execa.ExecaSyncReturnValue
  // runPackagerCommandOrThrow(command: string, options?: RunOptions): Execa.ExecaSyncReturnValue
  // runPackagerCommandGracefully(command: string, options?: RunOptions): Execa.ExecaSyncReturnValue
  runAsyncOrThrow(command: string, options?: RunOptions): Execa.ExecaChildProcess
  runAsyncGracefully(command: string, options?: RunOptions): Execa.ExecaChildProcess
  runPackagerCommandAsyncOrThrow(command: string, options?: RunOptions): Execa.ExecaChildProcess
  runPackagerCommandAsyncGracefully(command: string, options?: RunOptions): Execa.ExecaChildProcess
}

/**
 * Create a Run provider.
 *
 * Run provider makes it easy to run child processes.
 *
 * It uses [Execa](https://github.com/sindresorhus/execa) under the hood.
 *
 * If upstream includes `Dir` provider then is used to get the default CWD for commands.
 */
export const run = (params?: Params): Provider<Needs, Contributes> =>
  provider<Needs, Contributes>()
    .name('Run')
    .before((ctx, { log }) => {
      const cwd = ctx.fs?.cwd() ?? process.cwd()
      const packageManager = params?.packageManager ?? getPackageManager()
      const stdio = params?.debug ? 'inherit' : undefined

      const api: Contributes = {
        // runOrThrow(command, options) {
        //   log.trace(`will_run`, { command })
        //   return Execa.commandSync(command, {
        //     cwd,
        //     stdio,
        //     ...options,
        //   })
        // },
        // runGracefully(command, options) {
        //    return this.runOrThrow(command, {
        //     ...options,
        //     reject: false,
        //   })
        // },
        // runPackagerCommandOrThrow(command, options) {
        //   log.trace(`will_run`, { command })
        //   return Execa.commandSync(`${packageManager} ${command}`, {
        //     cwd,
        //     stdio,
        //     ...options,
        //   })
        // },
        // runPackagerCommandGracefully(command, options) {
        //   return this.runPackagerCommandOrThrow(command, {
        //     ...options,
        //     reject: false,
        //   })
        // },
        runAsyncOrThrow(command, options) {
          log.trace(`will_run`, { command })
          return Execa.command(command, {
            cwd,
            stdio,
            ...options,
          })
        },

        runAsyncGracefully(command, options) {
          return this.runAsyncOrThrow(command, {
            ...options,
            reject: false,
          })
        },
        runPackagerCommandAsyncOrThrow(command, options) {
          log.trace(`will_run`, { command })
          return Execa.command(`${packageManager} ${command}`, {
            cwd,
            stdio,
            ...options,
          })
        },
        runPackagerCommandAsyncGracefully(command, options) {
          return this.runPackagerCommandAsyncOrThrow(command, {
            ...options,
            reject: false,
          })
        },
      }

      return api
    })
    .done()

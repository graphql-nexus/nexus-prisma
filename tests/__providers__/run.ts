import { command as execaCommand, type SyncOptions, type ExecaChildProcess, type Options } from 'execa'
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

  factoryTimeout?: number
}

export type Needs = Partial<Providers.Dir.Contributes>
type RunOptions = SyncOptions
type RunAsyncOptions = RunOptions & {
  factoryTimeout?: number
}

export type Contributes = {
  // runOrThrow(command: string, options?: RunOptions): Execa.ExecaSyncReturnValue
  // runGracefully(command: string, options?: RunOptions): Execa.ExecaSyncReturnValue
  // runPackagerCommandOrThrow(command: string, options?: RunOptions): Execa.ExecaSyncReturnValue
  // runPackagerCommandGracefully(command: string, options?: RunOptions): Execa.ExecaSyncReturnValue
  runAsyncOrThrow(command: string, options?: RunAsyncOptions): ExecaChildProcess
  runAsyncGracefully(command: string, options?: RunAsyncOptions): ExecaChildProcess
  runPackagerCommandAsyncOrThrow(command: string, options?: RunAsyncOptions): ExecaChildProcess
  runPackagerCommandAsyncGracefully(command: string, options?: RunAsyncOptions): ExecaChildProcess
}

const runAsyncFactory =
  (runAsync: (command: string, options?: Options) => ExecaChildProcess, timeout: number) =>
  (command: string, options?: Options): ExecaChildProcess => {
    const start = Date.now()
    const promise = runAsync(command, options)

    const timeoutId = setTimeout(() => {
      promise.kill('SIGTERM', {
        forceKillAfterTimeout: timeout + 60 * 1000,
      })
    }, timeout)

    const summary = () => {
      const end = Date.now()
      const diff = (end - start) / 1000
      console.log(`RUN COMMAND (${diff}s)`, command)
    }
    promise
      .then(() => {
        clearTimeout(timeoutId)
        summary()
        return promise
      })
      .catch((error: any) => {
        clearTimeout(timeoutId)
        summary()
        console.log(error)
        return Promise.reject(error)
      })

    return promise
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
      const providerFactoryTimeout = params?.factoryTimeout ?? 2 * 60 * 1000
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
        runAsyncOrThrow(command, { factoryTimeout, ...options } = {}) {
          log.trace(`will_run`, { command })
          return runAsyncFactory(execaCommand, factoryTimeout ?? providerFactoryTimeout)(command, {
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
        runPackagerCommandAsyncOrThrow(command, { factoryTimeout, ...options } = {}) {
          log.trace(`will_run`, { command })
          return runAsyncFactory(execaCommand, factoryTimeout ?? providerFactoryTimeout)(
            `${packageManager} ${command}`,
            {
              cwd,
              stdio,
              ...options,
            }
          )
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

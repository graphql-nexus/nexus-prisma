import * as Setset from 'setset'

export namespace Runtime {
  export type SettingsInput = {
    /**
     * The name of the GraphQL context field to get an instance of Prisma Client from.
     *
     * This instance of Prisma Client is accessed in the default resolvers for relational fields.
     *
     * @default 'prisma'
     */
    prismaClientContextField?: string
    /**
     * Various checks to help you avoid mistakes while using Nexus Prisma.
     */
    checks?: {
      /**
       * #### What is this check?
       *
       * Nexus Prisma requires that you expose an instance of Prisma Client onto a field in your GraphQL
       * context so that Nexus Prisma can automate GraphQL field resolvers that need to interact with your
       * database. By default Nexus Prisma looks at the field `'prisma'` but you can change this.
       *
       * It makes sure that you have done the above correctly.
       *
       * #### How does this check work?
       *
       * The following steps are performed:
       *
       * 1. An `instanceof` check of the received value against the Prisma Client class.
       * 2. If 1 fails, then do duck type checks on the received value.
       * 3. If 1 and 2 both fail, an error is thrown. If only 1 fails then a warning is emitted.
       *
       * Remarks: A primary reason (there may be others) for both checks is that some development environments
       * like NextJS do optimized application "refreshes" that can lead to cases of 1 failing. It has
       * something to do with Node module cache busting leading to mixes of old and new JS Classes hanging
       * around together in memory.
       *
       * #### What happens when this check is disabled?
       *
       * You will not get any graceful handling of mistakes you make exposing the Prisma Client onto your
       * GraphQL context. Some generic (and thus unhelpful) runtime error will be thrown instead.
       *
       * Passing `boolean` is shorthand for `{ enabled: boolean }`.
       *
       * @default true
       */
      PrismaClientOnContext?:
        | boolean
        | {
            /**
             * Should this check be enabled?
             *
             * @default true
             */
            enabled?: boolean
            /**
             * @default true
             */
            warnWhenInstanceofStrategyFails?: boolean
          }
    }
  }

  export type SettingsData = Setset.InferDataFromInput<SettingsInput>

  export type Settings = Setset.Manager<SettingsInput, SettingsData>

  export const settings = Setset.create<SettingsInput, SettingsData>({
    fields: {
      prismaClientContextField: {
        initial: () => 'prisma',
      },
      checks: {
        fields: {
          PrismaClientOnContext: {
            shorthand: (enabled) => ({ enabled }),
            fields: {
              enabled: {
                initial: () => true,
              },
              warnWhenInstanceofStrategyFails: {
                initial: () => true,
              },
            },
          },
        },
      },
    },
  })

  export const changeSettings = (input: Setset.UserInput<SettingsInput>): void => {
    settings.change(input)
  }
}

import * as Setset from 'setset'

export type Input = {
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
     * Nexus Prisma requires that you expose an instance of Prisma Client onto a field in your GraphQL context
     * so that Nexus Prisma can automate GraphQL field resolvers that need to interact with your database. By
     * default Nexus Prisma looks at the field `'prisma'` but you can change this.
     *
     * It makes sure that you have done the above correctly.
     *
     * #### How does this check work?
     *
     * There are three strategies for this check. The default is called `instanceOf_duckType_fallback`. It is
     * a hybrid approach doing the following:
     *
     * 1. An `instanceof` check of the received value against the Prisma Client class.
     * 2. If 1 fails, then do duck type checks on the received value.
     * 3. If 1 and 2 both fail, an error is thrown. If only 1 fails then a warning is emitted.
     *
     * The other two strategies are `instanceOf` and `duckType` which use just their respective approaches.
     *
     * Remarks: A primary reason (there may be others) for having `instanceOf` and `duckType` strategies is
     * that some development environments like NextJS do optimized application "refreshes" that can lead to
     * cases of `instanceOf` strategy failing. It has something to do with Node module cache busting leading
     * to mixes of old and new JS Classes hanging around together in memory.
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
           * Which strategy should this check use?
           *
           * 1. `instanceOf`: See if the context value is an instance of the Prisma Client class.
           * 2. `duckType`: See if the context value appears to be a Prisma Client instance in practice by
           * looking for some telltale methods like `findMany`.
           * 3. `instanceOf_duckType_fallback`: A hybrid approach trying `instanceOf` and falling back to
           * `duckType`.
           *
           * @default 'instanceOf_duckType_fallback'
           */
          strategy?: 'instanceOf' | 'duckType' | 'instanceOf_duckType_fallback'
        }
  }
}

export type Data = Setset.InferDataFromInput<Input>

export type Manager = Setset.Manager<Input, Data>

export const create = () =>
  Setset.create<Input, Data>({
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
              strategy: {
                initial: () => 'instanceOf_duckType_fallback',
              },
            },
          },
        },
      },
    },
  })

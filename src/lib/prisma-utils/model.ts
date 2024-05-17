import { DMMF } from '@prisma/client/runtime/library'
import { RecordUnknown } from '../../helpers/utils'
import { inspect } from 'util'
import { Settings } from '../../generator/ModuleGenerators/JS'
import { PrismaUtils } from './index'
import { Messenger } from '../messenger'

export const getPrismaModel = (model: DMMF.Model, ctx: RecordUnknown, settings: Settings) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const prisma: any = ctx[settings.runtime.data.prismaClientContextField]
  const prismaOrmModelPropertyName = PrismaUtils.typeScriptOrmModelPropertyNameFromModelName(model.name)

  if (settings.runtime.data.checks.PrismaClientOnContext.enabled) {
    const performInstanceOfStrategy = () => {
      // eslint-disable-next-line
      let PrismaClientPackage: any
      try {
        // eslint-disable-next-line
        PrismaClientPackage = require(settings.gentime.prismaClientImportId)
      } catch (e) {
        // TODO rich errors
        throw new Error(
          `Could not perform "PrismaClientOnContext" check because there was an error while trying to import Prisma Client:\n\n${String(
            e,
          )}`,
        )
      }

      if (
        !(
          PrismaClientPackage !== null &&
          typeof PrismaClientPackage === 'object' &&
          // eslint-disable-next-line
          typeof PrismaClientPackage.PrismaClient === 'function'
        )
      ) {
        // TODO rich errors
        throw new Error(
          `Could not perform "PrismaClientOnContext" check because could not get a reference to a valid Prisma Client class. Found:\n\n${inspect(
            PrismaClientPackage,
          )}`,
        )
      }

      // eslint-disable-next-line
      return prisma instanceof PrismaClientPackage.PrismaClient
    }
    if (settings.runtime.data.checks.PrismaClientOnContext.strategy === 'duckType') {
      if (!PrismaUtils.duckTypeIsPrismaClient(prisma, prismaOrmModelPropertyName)) {
        console.error(1)
        // TODO rich errors
        throw new Error(
          `Check "PrismaClientOnContext" failed using "duckType" strategy. The GraphQL context.${settings.runtime.data.prismaClientContextField} value is not an instance of the Prisma Client.`,
        )
      }
    } else if (settings.runtime.data.checks.PrismaClientOnContext.strategy === 'instanceOf') {
      if (!performInstanceOfStrategy()) {
        throw new Error(
          `Check "PrismaClientOnContext" failed using "instanceOf" strategy. The GraphQL context.${settings.runtime.data.prismaClientContextField} value is not an instance of the Prisma Client.`,
        )
      }
    } else {
      if (!performInstanceOfStrategy()) {
        if (!PrismaUtils.duckTypeIsPrismaClient(prisma, prismaOrmModelPropertyName)) {
          // TODO rich errors
          throw new Error(
            `Check "PrismaClientOnContext" failed using "instanceOf_duckType_fallback" strategy. The GraphQL context.${settings.runtime.data.prismaClientContextField} value is not an instance of the Prisma Client.`,
          )
        }
        // DuckType passed but InstanceOf strategy failed, so show a warning.
        Messenger.showWarning({
          code: 'PrismaClientOnContextInstanceOfStrategyFailed',
          title: `Prisma Client on GraphQL context failed being checked using instanceof`,
          reason: `The Prisma Client class reference imported from ${settings.gentime.prismaClientImportId} is not the same class used by you to create your Prisma Client instance.`,
          consequence: `Maybe none since duck typing fallback indicates that the Prisma Client on the GraphQL context is actually valid. However relying on duck typing is hacky.`,
        })
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
  return prisma[prismaOrmModelPropertyName]
}

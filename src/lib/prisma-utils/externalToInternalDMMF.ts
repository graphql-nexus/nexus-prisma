// @ts-expect-error Private api
import * as PrismaClientGenerator from '@prisma/client/generator-build.js'
import { DMMF, DMMF as ExternalDMMF } from '@prisma/generator-helper'

// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
export const externalToInternalDmmf = PrismaClientGenerator.externalToInternalDmmf as (
  document: ExternalDMMF.Document,
) => DMMF.Document

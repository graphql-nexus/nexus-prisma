// @ts-expect-error Private api
import * as PrismaClientGenerator from '@prisma/client/generator-build'
import { DMMF, DMMF as ExternalDMMF } from '@prisma/generator-helper'

export const externalToInternalDmmf = PrismaClientGenerator.externalToInternalDmmf as (
  document: ExternalDMMF.Document
) => DMMF.Document

import { DMMF } from '@prisma/client/runtime'
import endent from 'endent'
import ono from 'ono'
import { detectProjectPackageManager, renderRunBin } from '../lib/packageManager'
import { d } from './debugNexusPrisma'
import { GITHUB_NEW_DISCUSSION_LINK } from './errorMessages'
import kleur = require('kleur')

export const getPrismaClientDmmf = (importId: string = '@prisma/client'): DMMF.Document => {
  d('get dmmf from @prisma/client')

  let dmmf: DMMF.Document | undefined

  try {
    dmmf = require(importId).dmmf
  } catch (error) {
    // prettier-ignore
    throw ono(error, endent`
      Failed to get Prisma Client DMMF. An error occured while trying to import it from ${kleur.yellow(importId)}.
    `)
  }

  if (!dmmf) {
    // prettier-ignore
    throw new Error(endent`
      Failed to get Prisma Client DMMF. It was imported from ${kleur.yellow(importId)} but was \`undefined\`.
      This usually means that you need to run Prisma Client generation. Please run ${renderRunBin(detectProjectPackageManager(), `prisma generate`)}.
      If that does not solve your problem, you can get community help by opening a discussion at ${kleur.yellow(GITHUB_NEW_DISCUSSION_LINK)}.
    `)
  }

  return dmmf
}

export type PrismaScalarType =
  | 'String'
  | 'Boolean'
  | 'Int'
  | 'BigInt'
  | 'Float'
  | 'Decimal'
  | 'DateTime'
  | 'Json'
  | 'Bytes'

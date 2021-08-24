import { DMMF } from '@prisma/client/runtime'
import dedent from 'dindist'
import ono from 'ono'
import { detectProjectPackageManager, renderRunBin } from '../lib/packageManager'
import { d } from './debugNexusPrisma'
import { GITHUB_NEW_DISCUSSION_LINK } from './errorMessages'
import kleur = require('kleur')

export const getPrismaClientDmmf = (importId?: string): DMMF.Document => {
  const importId_ = importId ?? '@prisma/client'

  d(`get dmmf from ${importId_}`)

  let maybeDmmf: DMMF.Document | undefined

  try {
    // We duck type check below
    // eslint-disable-next-line
    maybeDmmf = require(importId_).dmmf
  } catch (error) {
    // prettier-ignore
    throw ono(error, dedent`
      Failed to get Prisma Client DMMF. An error occured while trying to import it from ${kleur.yellow(importId_)}.
    `)
  }

  if (maybeDmmf === undefined) {
    // prettier-ignore
    throw new Error(dedent`
      Failed to get Prisma Client DMMF. It was imported from ${kleur.yellow(importId_)} but was \`undefined\`.
      This usually means that you need to run Prisma Client generation. Please run ${renderRunBin(detectProjectPackageManager(), `prisma generate`)}.
      If that does not solve your problem, you can get community help by opening a discussion at ${kleur.yellow(GITHUB_NEW_DISCUSSION_LINK)}.
    `)
  }

  /** Simple duck type to sanity check we got good data at runtime. */

  const dmmf = maybeDmmf
  const expectedFields = ['datamodel', 'schema', 'mappings'] as const

  if (expectedFields.find((fieldName) => dmmf[fieldName] && typeof dmmf[fieldName] !== 'object')) {
    throw new Error(dedent`
      The DMMF imported from ${importId_} appears to be invalid. Missing one/all of expected fields: 
    `)
  }

  return maybeDmmf
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

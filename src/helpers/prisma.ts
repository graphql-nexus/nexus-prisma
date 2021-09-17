import { DMMF } from '@prisma/client/runtime'
import dedent from 'dindist'
import kleur from 'kleur'
import ono from 'ono'
import { inspect } from 'util'
import { detectProjectPackageManager, renderRunBin } from '../lib/packageManager'
import { d } from './debugNexusPrisma'
import { GITHUB_NEW_DISCUSSION_LINK } from './errorMessages'

/**
 * Given a package loader, attempt to get the Prisma Client DMMF.
 *
 * @remarks Only the given require function is truly import, the rest is used for better error messages.
 *
 *          This function is designed to support working with bundlers. Specifically `ncc` has been
 *          tested.
 *
 *          This function intentionally does not do the `require`/`import` itself, leaving that to
 *          upstream code to handle in static ways that bundlers will be able to process.
 */
export const getPrismaClientDmmf = (packageLoader: {
  /**
   * A function that must return the Prisma Client Package
   */
  require: () => unknown
  /**
   * The import specifier being used (the from "..." part)
   */
  importId: string
  /**
   * The resolved import specifier being used. This can be different than important ID in two ways:
   *
   * 1. NodeJS lookp algorithm
   * 2. Bundlers that rewrite import paths
   */
  importIdResolved: string
}): DMMF.Document => {
  d('get dmmf from @prisma/client')

  let prismaClientPackage: unknown

  // prettier-ignore
  const printedImportId = `${kleur.yellow(packageLoader.importId)} (resolved as ${packageLoader.importIdResolved})`

  try {
    // eslint-disable-next-line
    prismaClientPackage = packageLoader.require()
  } catch (error) {
    // prettier-ignore
    throw ono(error as Error, dedent`
      Failed to get Prisma Client DMMF. An error occured while trying to import it from ${printedImportId}.
    `)
  }

  if (!(typeof prismaClientPackage === 'object' && prismaClientPackage !== null)) {
    // prettier-ignore
    throw new Error(dedent`
      Failed to get Prisma Client DMMF. It was imported from ${printedImportId} but was not the expected type. Got:

      ${inspect(prismaClientPackage)}
    `)
  }

  const prismaClientPackageObject = prismaClientPackage as Record<string, unknown>

  // eslint-disable-next-line
  if (!prismaClientPackageObject.dmmf) {
    // prettier-ignore
    throw new Error(dedent`
      Failed to get Prisma Client DMMF. It was imported from ${printedImportId} but did not contain "dmmf" data. Got:

      ${inspect(prismaClientPackage)}

      This usually means that you need to run Prisma Client generation. Please run ${renderRunBin(detectProjectPackageManager(), `prisma generate`)}.
      If that does not solve your problem, you can get community help by opening a discussion at ${kleur.yellow(GITHUB_NEW_DISCUSSION_LINK)}.
    `)
  }

  // Simple duck type to sanity check we got good data at runtime.

  const dmmf = prismaClientPackageObject.dmmf as DMMF.Document

  const expectedFields = ['datamodel', 'schema', 'mappings'] as const

  if (expectedFields.find((fieldName) => dmmf[fieldName] && typeof dmmf[fieldName] !== 'object')) {
    throw new Error(dedent`
      The DMMF imported from ${packageLoader.importId} appears to be invalid. Missing one/all of expected fields: 
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

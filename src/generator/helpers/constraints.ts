import { DMMF } from '@prisma/client/runtime'
import { RecordUnknown } from '../../helpers/utils'

/**
 * Find the unique identifiers necessary to indentify a field
 *
 * Unique fields for a model can be one of (in this order):
 * 1. One (and only one) field with an @id annotation
 * 2. Multiple fields with @@id clause
 * 3. One (and only one) field with a @unique annotation (if there are multiple, use the first one)
 * 4. Multiple fields with a @@unique clause
 */
export function resolveUniqueIdentifiers(model: DMMF.Model): string[] {
  // Try finding 1.
  const singleIdField = model.fields.find((f) => f.isId)

  if (singleIdField) {
    return [singleIdField.name]
  }

  // Try finding 2.
  if (model.idFields && model.idFields.length > 0) {
    return model.idFields
  }

  // Try finding 3.
  const singleUniqueField = model.fields.find((f) => f.isUnique)

  if (singleUniqueField) {
    return [singleUniqueField.name]
  }

  // Try finding 4.
  if (model.uniqueFields && model.uniqueFields.length > 0) {
    return model.uniqueFields[0] as string[] // I don't know why typescript want a cast here
  }

  throw new Error(`Unable to resolve a unique identifier for the Prisma model: ${model.name}`)
}

export function findMissingUniqueIdentifiers(
  data: RecordUnknown,
  uniqueIdentifiers: string[]
): string[] | null {
  const missingIdentifiers: string[] = []

  for (const identifier of uniqueIdentifiers) {
    if (!data[identifier]) {
      missingIdentifiers.push(identifier)
    }
  }

  if (missingIdentifiers.length > 0) {
    return missingIdentifiers
  }

  return null
}

export function buildWhereUniqueInput(data: RecordUnknown, uniqueIdentifiers: string[]): RecordUnknown {
  if (uniqueIdentifiers.length === 1) {
    return pickFromRecord(data, uniqueIdentifiers)
  }

  const compoundName = uniqueIdentifiers.join('_')

  return {
    [compoundName]: pickFromRecord(data, uniqueIdentifiers),
  }
}

function pickFromRecord(record: RecordUnknown, keys: string[]) {
  const output: Record<string, unknown> = {}

  for (const identifier of keys) {
    if (record[identifier]) {
      output[identifier] = record[identifier]
    }
  }

  return output
}

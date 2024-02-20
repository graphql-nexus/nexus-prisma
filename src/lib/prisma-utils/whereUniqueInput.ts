import { DMMF } from '@prisma/client/runtime/library'
import { pick } from 'lodash'
import { inspect } from 'util'
import { RecordUnknown } from '../../helpers/utils'
import { TypeScriptOrmCompoundUniquePropertyName } from './index_'

type FieldName = string

export const createWhereUniqueInput = (source: RecordUnknown, model: DMMF.Model) => {
  // TODO There is no reason to compute this every time. Memoize or move.
  const uniqueIdentifierFields = getUniqueIdentifierFields(model)
  const uniqueIdentifierFieldsMissingInData = uniqueIdentifierFields.filter((_) => source[_] == null)

  if (uniqueIdentifierFieldsMissingInData.length > 0) {
    // TODO rich errors
    throw new Error(
      `Cannot create Prisma Client where unique input because the source data (${inspect(
        source,
      )}) is missing the following unique identifier fields: ${uniqueIdentifierFieldsMissingInData.join(
        ', ',
      )}`,
    )
  }

  if (uniqueIdentifierFields.length === 1) {
    return pick(source, uniqueIdentifierFields)
  }

  return {
    [TypeScriptOrmCompoundUniquePropertyName(uniqueIdentifierFields)]: pick(source, uniqueIdentifierFields),
  }
}

/**
 * Get the field name (or names) of a model that are used to uniquely identify its records.
 *
 * If the model has no unique fields than error is thrown. This should be impossible as Prisma requires models
 * to have unique record identity setup.
 *
 * @remarks We support the following unique-record-identity patterns. The first one we find is used.
 *
 *          1. Exactly one field with an `@id` annotation.
 *          2. Multiple fields targeted by an `@@id` clause.
 *          3. Exactly one field with an `@unique` annotation (if multiple, use first).
 *          4. Multiple fields targeted by an `@@unique` clause.
 */
function getUniqueIdentifierFields(model: DMMF.Model): FieldName[] {
  // Try finding 1
  const singleIdField = model.fields.find((f) => f.isId)

  if (singleIdField) {
    return [singleIdField.name]
  }

  // Try finding 2
  if (model.primaryKey && model.primaryKey.fields.length > 0) {
    return model.primaryKey.fields
  }

  // Try finding 3
  const singleUniqueField = model.fields.find((f) => f.isUnique)

  if (singleUniqueField) {
    return [singleUniqueField.name]
  }

  // Try finding 4
  if (model.uniqueFields && model.uniqueFields.length > 0) {
    return model.uniqueFields[0] as string[] // I don't know why typescript want a cast here
  }

  throw new Error(`Unable to resolve a unique identifier for the Prisma model: ${model.name}`)
}

import { DMMF } from '@prisma/client/runtime'
import endent from 'endent'
import { chain } from 'lodash'
import * as Nexus from 'nexus'
import { NexusListDef, NexusNonNullDef, NexusNullDef } from 'nexus/dist/core'
import { ModuleSpec } from '../types'
import { fieldTypeToGraphQLType } from './declaration'

type Models = Record<
  string,
  Record<
    string,
    | {
        name: string
        // Any types required by Nexus API here. `unknown` does not work.
        // eslint-disable-next-line
        type: NexusNonNullDef<any> | NexusListDef<any> | NexusNullDef<any>
        description: string
      }
    | string
    | null
  >
>

export function createModuleSpec(): ModuleSpec {
  return {
    fileName: 'index.js',
    content: endent`
      const { getPrismaClientDmmf } = require('../helpers/prisma')
      const ModelsGenerator = require('../generator/models')

      const dmmf = getPrismaClientDmmf()
      const models = ModelsGenerator.JS.createModels(dmmf)

      module.exports = models
    `,
  }
}

export function createModels(dmmf: DMMF.Document): Models {
  const result = chain(dmmf.datamodel.models)
    .map((model) => {
      return {
        $name: model.name,
        $description: model.documentation ?? null,
        ...chain(model.fields)
          .map((field) => {
            return {
              name: field.name,
              type: fieldToNexusType(field),
              description: field.documentation ?? null,
            }
          })
          .keyBy('name')
          .value(),
      }
    })
    .keyBy('$name')
    .value()
  return result
}

// Complex return type I don't really understand how to easily work with manually.
// eslint-disable-next-line
export function fieldToNexusType(field: DMMF.Field) {
  const graphqlType = fieldTypeToGraphQLType(field)

  if (field.isList) {
    return Nexus.nonNull(Nexus.list(Nexus.nonNull(graphqlType)))
  } else if (field.isRequired) {
    return Nexus.nonNull(graphqlType)
  } else {
    return Nexus.nullable(graphqlType)
  }
}

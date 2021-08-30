import { DMMF } from '@prisma/client/runtime'

export type DocumentableNode = DMMF.Model | DMMF.Field | DMMF.DatamodelEnum

export const isModel = (node: DocumentableNode): node is DMMF.Model => {
  return 'fields' in node
}

export const isField = (node: DocumentableNode): node is DMMF.Field => {
  return 'isList' in node
}

export const isEnum = (node: DocumentableNode): node is DMMF.DatamodelEnum => {
  return 'values' in node
}

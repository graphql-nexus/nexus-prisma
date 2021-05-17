import { Specs } from '../../specs'
import { testGraphqlSchema } from '../../__helpers__'

testGraphqlSchema(Specs.relation1ToNReverse)
testGraphqlSchema(Specs.relation1ToNReverseAndOptional)

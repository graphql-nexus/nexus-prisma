import { Specs } from '../../specs'
import { testGraphqlSchema } from '../../__helpers__/testers'

testGraphqlSchema(Specs.relation1ToNReverse)
testGraphqlSchema(Specs.relation1ToNReverseAndOptional)

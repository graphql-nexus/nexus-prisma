import * as PrismaSDK from '@prisma/sdk'
import endent from 'endent'
import { generateRuntime } from '../src/generator/generate'
import { ModuleSpec } from '../src/generator/types'

export function createSchema(content: string): string {
  return endent`
    datasource db {
      provider = "postgresql"
      url      = env("DB_URL")
    }

    ${content}
  `
}

export async function generate(content: string): Promise<ModuleSpec[]> {
  const schema = createSchema(content)

  const dmmf = await PrismaSDK.getDMMF({
    datamodel: schema,
  })

  const runtime = generateRuntime(dmmf)

  return runtime
}

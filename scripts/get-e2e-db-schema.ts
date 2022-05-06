import arg from 'arg'
import fs from 'fs-jetpack'
import { z } from 'zod'

type ComboCase =
  | '14.x + windows-latest'
  | '14.x + macos-latest'
  | '14.x + ubuntu-latest'
  | '16.x + windows-latest'
  | '16.x + macos-latest'
  | '16.x + ubuntu-latest'

const nodeVersionParser = z.union([z.literal('14.x'), z.literal('16.x')])

const osParser = z.union([z.literal('macos-latest'), z.literal('ubuntu-latest'), z.literal('windows-latest')])

const prismaClientParser = z.string().regex(/\d+.\d+/)

const connectionStringMapping: Record<ComboCase, string> = {
  '14.x + macos-latest': 'node_14_macos_latest',
  '14.x + windows-latest': 'node_14_windows_latest',
  '14.x + ubuntu-latest': 'node_14_ubuntu_latest',
  '16.x + macos-latest': 'node_16_macos_latest',
  '16.x + windows-latest': 'node_16_windows_latest',
  '16.x + ubuntu-latest': 'node_16_ubuntu_latest',
}

const args = arg({
  '--os': String,
  '--node-version': String,
  '--prisma-client-version': String,
  '--github-env': String,
})

const schemaName = parseComboCase(
  args['--node-version'] ?? '',
  args['--os'] ?? '',
  args['--prisma-client-version'] ?? ''
)

if (args['--github-env']) {
  fs.append(args['--github-env'], `E2E_DB_SCHEMA=${schemaName}`)
} else {
  process.stdout.write(schemaName)
}

//
// Helpers
//

function parseComboCase(nodeVersionInput: string, osInput: string, prismaClientInput: string): string {
  const nodeVersion = nodeVersionParser.parse(nodeVersionInput)
  const os = osParser.parse(osInput)
  // eslint-disable-next-line
  const comboCase = [nodeVersion, os].join(' + ') as ComboCase
  const schema = connectionStringMapping[comboCase]
  if (!prismaClientInput) {
    return schema
  } else {
    const prismaClientVersion = prismaClientParser.parse(prismaClientInput)
    return [schema,prismaClient].join('_') 
  }
}

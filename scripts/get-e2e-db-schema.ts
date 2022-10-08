import arg from 'arg'
import fs from 'fs-jetpack'
import { z } from 'zod'

type ComboCase =
  | '14 + windows-latest'
  | '14 + macos-latest'
  | '14 + ubuntu-latest'
  | '16 + windows-latest'
  | '16 + macos-latest'
  | '16 + ubuntu-latest'

const nodeVersionParser = z.union([z.literal('14'), z.literal('16')])

const osParser = z.union([z.literal('macos-latest'), z.literal('ubuntu-latest'), z.literal('windows-latest')])

const prismaClientParser = z.string().regex(/4.\d+/)

const connectionStringMapping: Record<ComboCase, string> = {
  '14 + macos-latest': 'node_14_macos_latest',
  '14 + windows-latest': 'node_14_windows_latest',
  '14 + ubuntu-latest': 'node_14_ubuntu_latest',
  '16 + macos-latest': 'node_16_macos_latest',
  '16 + windows-latest': 'node_16_windows_latest',
  '16 + ubuntu-latest': 'node_16_ubuntu_latest',
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
  const comboCase: ComboCase = `${nodeVersion} + ${os}`
  const schema = connectionStringMapping[comboCase]
  if (!prismaClientInput) {
    return schema
  } else {
    const prismaClientVersion = prismaClientParser.parse(prismaClientInput)
    return [schema, prismaClientVersion].join('_')
  }
}

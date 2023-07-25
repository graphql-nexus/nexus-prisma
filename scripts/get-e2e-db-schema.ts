import arg from 'arg'
import fs from 'fs-jetpack'
import { z } from 'zod'


const numberParser = z.string().regex(/\d+/)

const osParser = z.union([z.literal('macos-latest'), z.literal('ubuntu-latest'), z.literal('windows-latest')])

const getConnectionString = ({ os, nodeVersion }: { nodeVersion: string, os: string }) => `node_${nodeVersion}_${os.replace('-', '_')}`

const args = arg({
  '--os': String,
  '--node-version': String,
  '--prisma-client-version': String,
  '--github-env': String
})

const schemaName = parseComboCase(
  args['--node-version'] ?? '',
  args['--os'] ?? '',
  args['--prisma-client-version'] ?? '',
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
  const nodeVersion = numberParser.parse(nodeVersionInput)
  const os = osParser.parse(osInput)
  const schema = getConnectionString({ nodeVersion, os})
  if (!prismaClientInput) {
    return schema
  } else {
    const prismaClientVersion = numberParser.parse(prismaClientInput)
    return [schema, prismaClientVersion].join('_')
  }
}

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
  '--db-url': String,
  '--github-env': String,
})

const comboCase = parseComboCase(args['--node-version'] ?? '', args['--os'] ?? '')

if (args['--github-env'] && args['--db-url']) {
  fs.append(
    args['--github-env'],
    `E2E_DB_SCHEMA=${args['--db-url']}?schema=${connectionStringMapping[comboCase]}`
  )
} else {
  process.stdout.write(connectionStringMapping[comboCase])
}

//
// Helpers
//

function parseComboCase(nodeVersionInput: string, osInput: string): ComboCase {
  const nodeVersion = nodeVersionParser.parse(nodeVersionInput)
  const os = osParser.parse(osInput)
  // eslint-disable-next-line
  return [nodeVersion, os].join(' + ') as any
}

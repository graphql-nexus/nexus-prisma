import arg from 'arg'
import { z } from 'zod'

type ComboCase =
  | '12.x + windows-latest'
  | '12.x + macos-latest'
  | '12.x + ubuntu-latest'
  | '14.x + windows-latest'
  | '14.x + macos-latest'
  | '14.x + ubuntu-latest'

const nodeVersionParser = z.union([z.literal('12.x'), z.literal('14.x')])

const osParser = z.union([z.literal('macos-latest'), z.literal('ubuntu-latest'), z.literal('windows-latest')])

const connectionStringMapping: Record<ComboCase, string> = {
  '12.x + macos-latest': 'node_12_macos_latest',
  '12.x + windows-latest': 'node_12_windows_latest',
  '12.x + ubuntu-latest': 'node_12_ubuntu_latest',
  '14.x + macos-latest': 'node_14_macos_latest',
  '14.x + windows-latest': 'node_14_windows_latest',
  '14.x + ubuntu-latest': 'node_14_ubuntu_latest',
}

const args = arg({
  '--os': String,
  '--node-version': String,
})

const comboCase = parseComboCase(args['--node-version'] ?? '', args['--os'] ?? '')

process.stdout.write(connectionStringMapping[comboCase])

//
// Helpers
//

function parseComboCase(nodeVersionInput: string, osInput: string): ComboCase {
  const nodeVersion = nodeVersionParser.parse(nodeVersionInput)
  const os = osParser.parse(osInput)
  // eslint-disable-next-line
  return [nodeVersion, os].join(' + ') as any
}

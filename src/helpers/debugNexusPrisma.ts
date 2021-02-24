import debug from 'debug'

const debugName = 'nexus-prisma'

export const d = debug(debugName)

export function debugNexusPrisma(...names: string[]) {
  return debug([debugName].concat(names).join(':'))
}

export function packageRun() {}

import kleur from 'kleur'

type DiagnosticInfo = {
  title: string
  code: string
  reason: string
  consequence: string
  solution?: string
  disable?: string
}

export function renderError(params: DiagnosticInfo): string {
  const solution = params.solution ? `\n\nSOLUTION: ${params.solution}` : ''
  const disable = params.disable ? `\n\nHOW TO DISABLE: ${params.disable}` : ''
  // prettier-ignore
  return `${kleur.red('ERROR:')} ${params.title}\n\nREASON: ${params.reason}\n\nCONSEQUENCE: ${params.consequence}${solution}${disable}\n\nCODE: ${params.code}`
}

export function renderWarning(params: DiagnosticInfo): string {
  const solution = params.solution ? `\n\nSOLUTION: ${params.solution}` : ''
  const disable = params.disable ? `\n\nHOW TO DISABLE: ${params.disable}` : ''
  // prettier-ignore
  return `${kleur.yellow('WARNING:')} ${params.title}\n\nREASON: ${params.reason}\n\nCONSEQUENCE: ${params.consequence}${solution}${disable}\n\nCODE: ${params.code}`
}

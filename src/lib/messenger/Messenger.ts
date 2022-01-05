import kleur from 'kleur'

type DiagnosticInfo = {
  title: string
  code: string
  reason: string
  consequence: string
  solution?: string
  disable?: string
}

export const renderList = (items: string[]): string => {
  return items.map((item) => `→ ${item}`).join('\n')
}

export const renderTitle = (title: string) => {
  return `${kleur.bold(title.toUpperCase())}:`
}

export const showWarning = (params: DiagnosticInfo): void => {
  console.log(renderWarning(params))
}

export function renderError(params: DiagnosticInfo): string {
  const solution = params.solution ? `\n\n${renderTitle('solution')} ${params.solution}` : ''
  const disable = params.disable ? `\n\n${renderTitle('how to disable')} ${params.disable}` : ''
  // prettier-ignore
  return `${kleur.red(renderTitle('error'))} ${params.title}\n\n${renderTitle('reason')} ${params.reason}\n\n${renderTitle('consequence')} ${params.consequence}${solution}${disable}\n\n${renderTitle('code')} ${params.code}`
}

export function renderWarning(params: DiagnosticInfo): string {
  const solution = params.solution ? `\n\n${renderTitle('solution')} ${params.solution}` : ''
  const disable = params.disable ? `\n\n${renderTitle('how to disable')} ${params.disable}` : ''
  // prettier-ignore
  return `${kleur.yellow(renderTitle('warning'))} ${params.title}\n\n${renderTitle('reason')} ${params.reason}\n\n${renderTitle('consequence')} ${params.consequence}${solution}${disable}\n\n${renderTitle('code')} ${params.code}`
}

export const renderCodeInline = (code: string): string => {
  return `\`${kleur.cyan(code)}\``
}

export const renderCodeBlock = (code: string): string => {
  return `\`\`\`\n${kleur.cyan(code)}\n\`\`\``
}

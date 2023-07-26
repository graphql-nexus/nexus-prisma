export const getPackageManager = () => process.env.PACKAGE_MANAGER ?? 'yarn'

export const getAdditionalPackagerCommandArgs = (packageManager: string, command: string) => {
  const packagerCommandArgsMap: Record<string, Record<string, string>> = {
    yarn: {
      install: ' --prefer-offline --verbose',
    },
  }

  const commandArgsMap = packagerCommandArgsMap[packageManager] ?? {}
  return commandArgsMap[command] ?? ''
}

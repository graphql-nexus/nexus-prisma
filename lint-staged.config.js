const filter = (filenames) =>
  filenames.filter((filename) =>
    ['docs', 'tests/e2e/fixtures'].every((pattern) => filename.indexOf(pattern) === -1),
  )

module.exports = {
  '*': 'prettier --ignore-unknown --check',
  '*.{ts,tsx}': (filenames) => [
    `yarn eslint --ext .ts,.tsx --max-warnings 0 ${filter(filenames).join(' ')}`,
    'yarn type:check --skipLibCheck',
  ],
}

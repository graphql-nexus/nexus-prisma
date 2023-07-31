module.exports = {
  '*': 'prettier --ignore-unknown --check',
  '*.{ts,tsx}': (filenames) => [
    `yarn eslint --ext .ts,.tsx --max-warnings 0 ${filenames.join(' ')}`,
    'yarn type:check --skipLibCheck',
  ],
}

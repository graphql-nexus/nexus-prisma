const automaticCommitPattern = /^chore\(release\):.*\[skip ci]/

const commitlintConfig = {
  extends: ['@commitlint/config-conventional'],

  ignores: [(commitMsg) => automaticCommitPattern.test(commitMsg)],
}

module.exports = commitlintConfig

module.exports = {
  extends: ['./.releaserc.js'],
  branches: [process.env.PR_HEAD_REF],
  dryRun: true,
}

/**
 * @Author: Rostislav Simonik <rostislav.simonik@technologystudio.sk>
 * @Date: 2024-12-02T22:12:62+01:00
 * @Copyright: Technology Studio
 * @ts-check
 */

module.exports = {
  extends: ['./.releaserc.js'],
  branches: [process.env.PR_HEAD_REF],
  dryRun: true,
}

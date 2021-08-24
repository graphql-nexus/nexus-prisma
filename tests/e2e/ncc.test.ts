import * as Path from 'path'
import { setupTestProject } from '../__helpers__/testProject'

it('works with ncc', async () => {
  const testProject = setupTestProject({
    fixture: Path.join(__dirname, 'fixtures/ncc'),
  })

  await testProject.runOrThrowNpmScript(`build`)

  // Remove this to ensure that when the ncc build is run in the next step
  // it is truly running independent of any node_modules.
  await testProject.fs.remove('node_modules')

  const result = await testProject.runOrThrowNpmScript(`start:dist`)

  expect(result.stdout).toMatchSnapshot()
})

import * as Path from 'path'
import { setupTestProject } from '../__helpers__/testProject'

it('works with ncc', async () => {
  const testProject = setupTestProject({
    fixture: Path.join(__dirname, 'fixtures/ncc'),
  })

  await testProject.runOrThrowNpmScript(`build`)

  const result = await testProject.runOrThrowNpmScript(`start:dist`)

  expect(result.stdout).toMatchSnapshot()
})

import * as Path from 'path'
import { setupTestProject } from '../__helpers__/testProject'

it('works with ncc', async () => {
  const testProject = setupTestProject({
    fixture: Path.join(__dirname, 'fixtures/ncc'),
  })

  await testProject.runOrThrow(`npm install --force`)

  await testProject.runOrThrow(`npm run build`)

  const result = await testProject.runOrThrow(`npm run start:dist`)

  expect(result.stdout).toMatchSnapshot()
})

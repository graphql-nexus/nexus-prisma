const { promisify } = require('util')
const fs = require('fs')
const path = require('path')

const copyFile = promisify(fs.copyFile)
const mkdir = promisify(fs.mkdir)

ensureEmptyDotPrisma()

async function ensureEmptyDotPrisma() {
  try {
    const inTheNodeModules = __dirname.includes('/node_modules') || __dirname.includes('/.yalc')
    const dotNexusPrismaDir = path.join(
      __dirname,
      inTheNodeModules ? '../../../../node_modules/.nexus-prisma' : '../../.nexus-prisma',
    )
    if (!fs.existsSync(dotNexusPrismaDir)) {
      await mkdir(dotNexusPrismaDir)
    }
    const defaultIndexJsPath = path.join(dotNexusPrismaDir, 'index.js')
    const defaultIndexDTSPath = path.join(dotNexusPrismaDir, 'index.d.ts')
    const defaultPackagePath = path.join(dotNexusPrismaDir, 'package.json')

    if (!fs.existsSync(defaultPackagePath)) {
      await copyFile(path.join(__dirname, 'default-package.json'), defaultPackagePath)
    }

    if (!fs.existsSync(defaultIndexJsPath)) {
      await copyFile(path.join(__dirname, 'default-index.js'), defaultIndexJsPath)
    }

    if (!fs.existsSync(defaultIndexDTSPath)) {
      await copyFile(path.join(__dirname, 'default-index.d.ts'), defaultIndexDTSPath)
    }
  } catch (e) {
    console.error(e)
  }
}

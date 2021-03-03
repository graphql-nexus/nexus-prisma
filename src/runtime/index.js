const { getPrismaClientDmmf } = require('../helpers/prisma')
const ModelsGenerator = require('../generator/models')

const dmmf = getPrismaClientDmmf()
const models = ModelsGenerator.JS.createModels(dmmf)

module.exports = models
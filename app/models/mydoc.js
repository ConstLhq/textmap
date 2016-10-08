var mongoose = require('mongoose')
var MydocSchema = require('../schemas/mydoc')
var Mydoc = mongoose.model('Mydoc', MydocSchema)
module.exports = Mydoc
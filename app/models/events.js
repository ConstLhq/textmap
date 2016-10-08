var mongoose = require('mongoose')
var EventsSchema = require('../schemas/events')
var Events = mongoose.model('Events', EventsSchema)
module.exports = Events
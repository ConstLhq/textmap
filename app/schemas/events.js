var mongoose = require('mongoose')
var Schema = mongoose.Schema
var ObjectId = Schema.Types.ObjectId

var EventsSchema = new Schema({


  mydoc: {
    type: ObjectId,
    ref: 'Mydoc'
  },
  xml: String,
  raw: String,
  json: {},
  meta: {
    createAt: {
      type: Date,
      default: Date.now()
    },
    updateAt: {
      type: Date,
      default: Date.now()
    }
  }
})

// var ObjectId = mongoose.Schema.Types.ObjectId
EventsSchema.pre('save', function(next) {
  if (this.isNew) {
    this.meta.createAt = this.meta.updateAt = Date.now()
  } else {
    this.meta.updateAt = Date.now()
  }

  next()
})

EventsSchema.statics = {
  fetch: function(cb) {
    return this
      .find({})
      .sort('meta.updateAt')
      .exec(cb)
  },
  findById: function(id, cb) {
    return this
      .findOne({
        _id: id
      })
      .exec(cb)
  }
}

module.exports = EventsSchema
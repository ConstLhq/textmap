var mongoose = require('mongoose')
var Schema = mongoose.Schema
var ObjectId = Schema.Types.ObjectId

var MydocSchema = new Schema({

  originalName: String,
  content: String,
  sequence: Boolean,
  owner: {
    type: ObjectId,
    ref: 'User'
  },
  events: [{
    type: ObjectId,
    ref: 'Events'
  }],
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
MydocSchema.pre('save', function(next) {
  if (this.isNew) {
    this.meta.createAt = this.meta.updateAt = Date.now()
  } else {
    this.meta.updateAt = Date.now()
  }

  next()
})

MydocSchema.statics = {
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

module.exports = MydocSchema
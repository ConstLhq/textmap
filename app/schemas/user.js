var mongoose = require('mongoose')
var SALT_WORK_FACTOR = 10
var Schema = mongoose.Schema
var ObjectId = Schema.Types.ObjectId

var UserSchema = new mongoose.Schema({
  name: {
    unique: true,
    type: String
  },
  password: String,
  // 0: nomal user
  // >10: admin

  role: {
    type: Number,
    default: 0
  },
  mydoc: [{
    type: ObjectId,
    ref: 'Mydoc'
  }],
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

UserSchema.pre('save', function(next) {
  var user = this

  if (this.isNew) {
    this.meta.createAt = this.meta.updateAt = Date.now()
  } else {
    this.meta.updateAt = Date.now()
  }

  next()
})

UserSchema.methods = {
  comparePassword: function(_password) {
    if (_password === this.password) {
      return true
    } else
      return false
  }
}

UserSchema.statics = {
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


module.exports = UserSchema
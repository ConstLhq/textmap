var mongoose = require('mongoose')
var User = mongoose.model('User')

var Events = mongoose.model('Events')
var Mydoc = mongoose.model('Mydoc')

// signup
exports.showSignup = function(req, res) {
  res.render('signup', {
    title: '注册页面'
  })
}
exports.showSignin = function(req, res) {
  res.render('signin', {
    title: '登录页面'
  })
}
exports.signup = function(req, res) {
    var _user = req.body
    _user.like = [];
    User.findOne({
      name: _user.name
    }, function(err, user) {
      if (err) {
        console.log(err)
      }
      if (user) {
        return res.redirect('/signin')
      } else {
        user = new User(_user)
        user.save(function(err, user) {
          if (err) {
            console.log(err)
          }
          res.redirect('/')
        })
      }
    })
  }
  // signin
exports.signin = function(req, res) {
  var _user = req.body
  var name = _user.name
  var password = _user.password
  User.findOne({
    name: name
  }, function(err, user) {
    if (err) {
      console.log(err)
    }

    if (!user) {
      return res.redirect('/signup')
    }

    if (user.comparePassword(password)) {

      req.session.user = user
      return res.redirect('/')
    } else {
      return res.redirect('/signin')
    }
  })
}

// logout
exports.logout = function(req, res) {
  delete req.session.user
    //delete app.locals.user
  res.redirect('/')
}

// userlist page
exports.list = function(req, res) {
    User.fetch(function(err, users) {
      if (err) {
        console.log(err)
      }
      res.render('userlist', {
        title: '用户列表页',
        users: users
      })
    })
  }
  // midware for user
exports.signinRequired = function(req, res, next) {
  var user = req.session.user
  if (!user) {
    return res.redirect('/signin')
  }
  next()
}
exports.adminRequired = function(req, res, next) {
  var user = req.session.user
  if (user.role <= 10) {
    return res.redirect('/signin')
  }
  next()
}

exports.del = function(req, res) {
  var id = req.query.id
    //var user = req.session.user
  if (id) {
    User.remove({
      _id: id
    }, function(err, course) {
      if (err) {
        console.log(err)
        res.json({
          success: 0
        })
      } else {
        res.json({
          success: 1
        })
      }
    })
  }
}
exports.recommend = function(req, res) {
  var _user_id = req.params.id || req.session.user._id
  if (!_user_id) {
    return res.redirect('/signin')
  }
  User
    .find({
      _id: _user_id
    })
    .populate({
      path: 'like',
      select: '_id title poster',
      options: {}
    })
    .exec(function(err, user) {
      if (err) {
        console.log(err)
      }
      if (user[0].like.length == 0) {
        res.render('cs_recommend', {
          title: "欢迎新人，暂无推荐",
          cat: [],
          rec: []
        })
        return 0;
      }
      // Create an Event Store Manager (ESM) 
      var esm = new g.MemESM()
        // Initialize GER with the esm
      var ger = new g.GER(esm);

      ger.initialize_namespace('courses')
        .then(function() {
          User
            .find()
            .populate({
              path: 'like',
              select: '_id title poster',
              options: {}
            })
            .exec(function(err, users) {
              var events = []
              for (var i = 0; i < users.length; i++) {
                usr = users[i]
                for (var j = 0; j < usr.like.length; j++) {
                  var cs = usr.like[j]
                  var userID = usr._id;
                  var csId = cs._id;
                  events.push({
                    namespace: 'courses',
                    person: userID.toString(),
                    action: 'likes',
                    thing: csId.toString(),
                    expires_at: '2020-06-06'
                  })
                }
              }
              return ger.events(events);
            })
            .then(function() {
              var uId = _user_id
              return ger.recommendations_for_person('courses', uId.toString(), {
                actions: {
                  likes: 1
                }
              })
            })
            .then(function(recommendations) {
              var recommendationsArray = recommendations.recommendations;
              var recommend_course = []
              for (var i = 0; i < recommendationsArray.length; i++) {
                Course
                  .findById(recommendationsArray[i].thing, function(err, course) {
                    if (err) {
                      console.log(err)
                    }
                    recommend_course.push(course)
                    if (recommend_course.length == recommendationsArray.length) {
                      res.render('cs_recommend', {
                        title: "个人中心",
                        cat: user[0].like,
                        rec: recommend_course
                      })
                    }
                  })
              }
            })
        })
    })
}
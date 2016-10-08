var express = require('express');
var path = require('path');
var mongoose = require('mongoose')
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session')
var mongoStore = require('connect-mongo')(session)
var fs = require('fs')
	// var multer= require('multer')

// var users = require('./routes/users');

var app = express();

var dbUrl = 'mongodb://localhost:27017/textmap'

mongoose.connect(dbUrl)

//load models
var models_path = path.join(__dirname, '/app/models')
var walk = function(path) {
	fs
		.readdirSync(path)
		.forEach(function(file) {
			var newPath = path + '/' + file
			var stat = fs.statSync(newPath)

			if (stat.isFile()) {
				if (/(.*)\.js/.test(file)) {
					require(newPath)
				}
			} else if (stat.isDirectory()) {
				walk(newPath)
			}
		})
}
walk(models_path)

// view engine setup
app.set('views', path.join(__dirname, './app/views/pages'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: false
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
	app.use(function(err, req, res, next) {
		res.status(err.status || 500);
		res.render('error', {
			message: err.message,
			error: err
		});
	});
}

// production error handler
// no stacktraces leaked to user

app.use(session({
	secret: 'nothing',
	resave: false,
	saveUninitialized: true,
	store: new mongoStore({
		url: dbUrl,
		collection: 'sessions'
	})
}));

app.use(function(req, res, next) {
	res.locals.user = req.session.user;
	res.locals.post = req.session.post;
	next();
});

var routes = require('./routes/index');

// app.use(multer({dest: 'public/uploads',
//           rename:function(filedname,originalname){
//             console.log(originalname)
//             var fileFormat = (originalname).split(".");
//             return fileFormat[0] + '-' + Date.now() + "." + fileFormat[fileFormat.length - 1];
//           },
//           onFileUploadStart:function(file){
//                   console.log('^%$^%^$@#%$^%&^')
//                 fs.readFile(file.path, function (err, data) {
//                   if (err) throw err;
//                   console.log(data);
//                 });

//                 }}));
app.use('/', routes);
// app.use('/users', users);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
	var err = new Error('Not Found');
	err.status = 404;
	next(err);
});
module.exports = app;
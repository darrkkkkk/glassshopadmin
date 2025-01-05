var createError = require('http-errors');
var hbs = require('hbs');
var express = require('express');
const session = require('express-session');
var path = require('path');
const passport = require('passport');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var MongoStore = require('connect-mongo');

var cors = require('cors');
require('./config/passport')(passport); 
// Connect to database
require('dotenv').config({ path: 'dbconfig.env' })
var database = require('./config/db');
const dbconfig = {
  url: process.env.DB_URL || ""
}
database.connect(dbconfig.url);

var indexRouter = require('./component/admin/adminRoute.js');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
hbs.registerPartials(__dirname + '/views/partials');
hbs.registerHelper('eq', function (a, b) {
  return a === b;
});
hbs.registerHelper('firstLetter', function(str) {
  return str ? str.charAt(0).toUpperCase() : '';
});
app.use(session({
  secret: 'adminSecret', // Use a different secret for admin
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: dbconfig.url, collectionName: 'adminSessions' }), // Use a different collection for admin sessions
  cookie: { maxAge: 180 * 60 * 1000, name: 'admin.sid' } // Use a different cookie name for admin
}));


// Initialize Passport and session
app.use(passport.initialize());
app.use(passport.session());
app.use((req, res, next) => {
  res.locals.user = req.user || null; // Passport.js provides req.user if authenticated
  next();
});

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());

app.use('/', indexRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;

var port = 3003;
app.listen(port, () => {
  console.log('Listening...')
})
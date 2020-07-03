const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const mongoose  = require('mongoose');
const Dishes = require('./models/dishes')
const connectDb = require("./connect");
var dotenv = require("dotenv");
var passport = require('passport');
var authenticate = require('./authenticate');

var app = express();

app.all('*',(req,res,next) =>{
  if(req.secure){
    return next();
  }
  else{
    res.redirect(307,'https://' + req.hostname + ':' + app.get('secPort') + req.url);
  }
})

app.use(passport.initialize());
app.use(passport.session())
app.use(logger("dev"));

dotenv.config(); //loading in the env in process object
connectDb();     //connection to mongoDB Atlas

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Routes
//var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var dishRouter = require('./routes/dishRouter');
var promoRouter = require('./routes/promoRouter');
var leaderRouter = require('./routes/leaderRouter');
const uploadRouter = require('./routes/uploadRouter');

app.use('/users',usersRouter);

app.use(express.static(path.join(__dirname, 'public')));

app.use('/dishes',dishRouter);
app.use('/promotions',promoRouter);
app.use('/leaders',leaderRouter);
app.use('/imageUpload',uploadRouter);

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

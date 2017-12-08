var express = require('express');
var router = express.Router();
var passport = require('passport');
var multer = require('multer');
var LocalStrategy = require('passport-local').Strategy;
var mongo = require('mongodb');
var flash = require('connect-flash');

var User = require('../models/user');
/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.get('/register', function(req, res, next) {
  res.render('register', {'title' : 'Register'});
});

router.get('/login', function(req, res, next) {
  res.render('login', {'title' : 'Login'});
});

var upload = multer({ dest: './public/images/uploads' });

router.post('/register',upload.single('profileimage'),function (req, res, next) {
	var name = req.body.name;
	var email = req.body.email;
	var username = req.body.username;
	var password = req.body.password;
	var password2 = req.body.password2;

	if(req.file){
		var profileImageOriginalName = req.file.originalname;
		var profileImageName = req.file.filename;
		var profileImageMime = req.file.mimetype;
		var profileImagePath = req.file.path;
		var profileImageExt = req.file.extension;
		var profileImageSize = req.file.size;
	}else{
		var profileImageName = "noimage.jpg";
	}
	
	req.checkBody('name', 'Name field is required').notEmpty();
	req.checkBody('email', 'Email Id not Valid').isEmail();
	req.checkBody('username', 'Username field is required').notEmpty();
	req.checkBody('password', 'Name field is required').notEmpty();
	req.checkBody('password2', 'Password do not match').equals(req.body.password);

	var errors = req.validationErrors();
	
	if(errors){
		res.render('register', {
			errors: errors,
			name: name,
			email: email,
			username: username,
			password: password,
			password2: password2
		});
		
	}else{
		//Create User
		var newUser = new User ({
			name: name,
			email: email,
			username: username,
			password: password,
			profileimage: profileImageOriginalName
		});

		User.createUser(newUser, function (err, user) {
			if(err){
				throw err;
			}
			console.log(user);
		});

		//res.flash('success', 'You are now registered and may log in');
		res.location('/');
		res.redirect('/');
	}
});

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.getUserById(id, function(err, user) {
    done(err, user);
  });
});

passport.use(new LocalStrategy(
	function (username, password, done) {
		console.log('in');
		User.getUserByUsername(username, function (err, user) {
			if(err) throw err;
			if(!user){
				console.log('Unknown User');
				return done(null, false, {message: 'Unknown User'});
			}
			/*
			if (!user.validPassword(password)) {
				console.log('Invalid Password');
		    	return done(null, false, { message: 'Incorrect password.' });
		    }
		    return done(null, user);
			*/
			User.comparePassword(password, user.password, function (err, isMatch) {
				if(err) throw err;
				if(isMatch){
					return done(null, user);
				}
				else {
					console.log('Invalid Password');
					return done(null, false, {message: 'Invalid Password'});
				}
			});
			
		});		
	}
));

router.post('/login', passport.authenticate('local', {failureRedirect:'/users/login', failureFlash: 'Invalid Username or Password'}), function (req, res) {
	console.log('authentication successful');
	req.flash('success', 'you are logged in');
	res.redirect('/');
});

router.get('/logout', function (req, res) {
	req.logout;
	req.flash('success', "You have logged out");
	res.redirect('/users/login');
});

module.exports = router;

var express = require('express');
var router = express.Router();
var passport = require('passport');
var auth = require('./auth');

/* GET home page. */
router.get('/', function(req, res, next) {
  if (!req.isAuthenticated()) {
    res.render('index', { title: 'Express' });
  }

  if (req.user.superAdmin) {
    res.redirect('/admin');
  }
  else {
    res.redirect('/user');
  }

});

// GET login page
router.get('/login', function(req, res, next){
	res.render('login');
});

// GET admin page
router.get('/admin', auth.ensureAuthenticated, auth.ensureSuperAdmin, function(req, res){
	res.render('admin');
});

// GET user page
router.get('/user', auth.ensureAuthenticated, function(req, res){
	res.render('user');
});

router.post('/auth/local', passport.authenticate('local', {failureRedirect: '/login'}),
  function(req, res){
    res.redirect('/');
  });

router.get('/auth/basic', passport.authenticate('basic', {failureRedirect: '/login'}),
  function(req, res) {
    res.redirect('/');
  })

//   POST /auth/openid
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  The first step in OpenID authentication will involve redirecting
//   the user to their OpenID provider.  After authenticating, the OpenID
//   provider will redirect the user back to this application at
//   /auth/openid/return
router.post('/auth/openid', 
  passport.authenticate('openid', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/');
  });

//   GET /auth/openid/return
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  If authentication fails, the user will be redirected back to the
//   login page.  Otherwise, the primary route function function will be called,
//   which, in this example, will redirect the user to the home page.
router.get('/auth/openid/return', 
  passport.authenticate('openid', { failureRedirect: '/login' }),
  function(req, res) {
    // res.redirect('/');
    //if (req.user.superAdmin)
    	// redirect to admin dashboard (super admin)
      //res.redirect('/admin');
    //else
    	// redirect to user dashboard
       
      // Always redirect to user-page 
      res.redirect('/user'); 
  });

// GET logout
// ends the express session
router.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});


// GET denied
// To show this page if user is not authenticated and tries to access user page, or is not an admin but tries to 
// enter admin page
router.get('/denied', function(req, res){
  res.render('access_denied');
});

module.exports = router;

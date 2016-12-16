var express = require('express');
var router = express.Router();
var multer = require('multer');
var mkdirp = require('mkdirp');
var glob = require('glob');
var path = require('path');
var fs = require('fs');
var db = require('seraph')({
	server: process.env.SERVER_URL || 'http://localhost:7474/', // 'http://studionetdb.design-automation.net'
	user: process.env.DB_USER,
	pass: process.env.DB_PASS
});
var auth = require('./auth');

var storage = multer.diskStorage({
	destination: function(req, file, cb) {
		var dest = './uploads/' + req.body.username;

		mkdirp(dest, function(err){
			if (err)
				console.log(err);
			else{
				console.log('created', dest);
				cb(null, dest);
			}
		});
	},
	filename: function(req, file, cb){
		cb(null, file.originalname);
	}
});

var avatarStorage = multer.diskStorage({
	destination: function(req, file, cb) {
		var dest = './uploads/' + req.user.nusOpenId + '/avatar/';

		var toDelete = glob.sync(dest + 'avatar.*');
		// remove any old avatar if the user uploads a new one
		toDelete.forEach(function(item, index, array){
			fs.unlink(item, function(err){
				if (err) throw err;
			})
		});

		// if folder does not exist, create it
		mkdirp(dest, function(err){
			if (err)
				console.log(err);
			else{
				console.log('created', dest);
				cb(null, dest);
			}
		});
	},
	filename: function(req, file, cb){
		// keep the extension of the avatar
		cb(null, 'avatar'+file.originalname.slice(file.originalname.lastIndexOf('.')));
	}
});

var modelStorage = multer.diskStorage({
	destination: function(req, file, cb) {
		var dest = './uploads/' + req.user.nusOpenId + '/models/';

		mkdirp(dest, function(err){
			if (err)
				console.log(err);
			else{
				console.log('created', dest);
				cb(null, dest);
			}
		});
	},
	filename: function(req, file, cb){
		cb(null, file.originalname);
	}
});


router.post('/', auth.ensureAuthenticated, multer({
		storage: storage
}).single('file'), function(req, res, next) {
  console.log(req.body);
  console.log(req.file);
  res.send('success');
});

// POST: /uploads/avatar
// Upload a new profile picture
router.post('/avatar', auth.ensureAuthenticated, multer({
	storage: avatarStorage
}).single('avatar'), function(req, res, next){
	// update avatar for user

	var query = [
		'MATCH (u:user) WHERE ID(u)=' + req.user.id,
		'WITH u',
		'SET u.avatar={avatarParam}',
		'RETURN u'
	].join('\n');

	var params = {
		avatarParam: '/uploads/' + req.user.nusOpenId + '/avatar'
	};
	
	db.query(query, params, function(error ,result){
		if (error)
			console.log(error);
		else
			res.send(result[0]);
	})

});

// POST :/uploads/models
// POST a new model for this user
router.post('/models', auth.ensureAuthenticated, multer({
	storage: modelStorage
}).single('model'), function(req, res, next){

	var query = [
		'MATCH (u:user) WHERE ID(u)=' + req.user.id,
		'WITH u',
		'CREATE (f:file {type: {typeParam}, date: {dateParam}, size: {sizeParam}, name: {nameParam}})',
		'WITH u,f',
		'CREATE (u)-[v:UPLOADED {type: {typeParam}}]->(f)',
		'RETURN f'
	].join('\n');

	var params = {
		typeParam: 'model',
		dateParam: Date.now(),
		sizeParam: req.file.size,
		nameParam: req.file.filename
	}

	db.query(query, params, function(error, result){
		if (error)
			console.log(error);
		else
			res.send(result[0]);
	})
});

// GET: /uploads/:nusOpenId/avatar
// GET user's avatar by nusOpenId param
router.get('/:nusOpenId/avatar', auth.ensureAuthenticated, function(req, res){
	var avatar = glob.sync('./uploads/' + req.params.nusOpenId + '/avatar/'  + 'avatar.*');
	res.sendFile(path.resolve(__dirname + '/../') +'/' + avatar[0]);	// sendFile does not like /../  ...
});

// GET: /uploads/:nusOpenId/models
// GET user's uploaded models info by nusOpenId param
// consider only allowing authorised users to view?
router.get('/:nusOpenId/models', auth.ensureAuthenticated, function(req,res){
	var query = [
		'MATCH (u:user) WHERE ID(u) = ' + req.user.id,
		'WITH u',
		'MATCH (u)-[v:UPLOADED]->(f)',
		'RETURN f'
	].join('\n');

	db.query(query, function(error, result){
		if (error)
			console.log(error);
		else
			res.send(result);
	});
});

router.get('/:nusOpenId/models/:modelId', auth.ensureAuthenticated, function(req, res){
	var query = [
		'MATCH (f:file) WHERE ID(f) = ' + req.params.modelId,
		'RETURN f'
	].join('\n');

	db.query(query, function(error, result){
		if (error)
			console.log(error);
		else{
			res.sendFile(path.resolve(__dirname + '/../') + '/uploads/' + req.params.nusOpenId + '/models/' + result[0].name);
		}
	})
});

module.exports = router;

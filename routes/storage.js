var multer = require('multer');
var mkdirp = require('mkdirp');
var glob = require('glob');
var path = require('path');
var fs = require('fs');

var storage = {};

storage.storage = multer.diskStorage({
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

storage.avatarStorage = multer.diskStorage({
	destination: function(req, file, cb) {
		var dest = './uploads/users/' + req.user.nusOpenId + '/avatar/';

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

storage.modelStorage = multer.diskStorage({
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

storage.attachmentStorage = multer.diskStorage({
	destination: function(req, file, cb) {
		var dest = req.tempFileDest;

		mkdirp(dest, function(err){
			if (err)
				console.log(err);
			else {
				console.log('created', dest);
				cb(null, dest);
			}
		})
	},
	filename: function(req, file, cb) {
		cb(null, file.originalname);
	}
});

module.exports = storage;
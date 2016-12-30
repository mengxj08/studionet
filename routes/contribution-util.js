var mkdirp = require('mkdirp');
var glob = require('glob');
var path = require('path');
var fs = require('fs-extra');
var gm = require('gm');
var mmm = require('mmmagic'),
      Magic = mmm.Magic;
var db = require('seraph')({
	server: process.env.SERVER_URL || 'http://localhost:7474/', // 'http://studionetdb.design-automation.net'
	user: process.env.DB_USER,
	pass: process.env.DB_PASS
});

module.exports.handleGetContributionsWithoutParams = function(req, res, next) {

	var numKeys = Object.keys(req.body).length;
	var hasParams = numKeys > 0;

	if (hasParams) {
		return next();
	}

	var query = [
		'MATCH (c:contribution)',
		'WITH c',
		'RETURN ({title: c.title, createdBy: c.createdBy, dateCreated: c.dateCreated, id: id(c)})'		
	].join('\n');

	db.query(query, function(error, result) {
		if (error){
			console.log('[ERROR] Attempt to fetch all contributions by /api/contributions failed.');
			return res.send('error getting all contributions');
		}
		res.send(result);
	});

}

module.exports.ensureGetContributionsCorrectParams = function(req, res, next) {
	var numKeys = Object.keys(req.body).length;
	var NUM_QUERY_KEYS_CONTRIBUTION = 6;

	var REQ_DEPTH_KEYWORD = 'd';
	var REQ_GROUPS_KEYWORD = 'g';
	var REQ_RATING_KEYWORD = 'r';
	var REQ_USERS_KEYWORD = 'u';
	var REQ_TIME_KEYWORD = 't';
	var REQ_TAGS_KEYWORD = 'tg';

	if (numKeys !== NUM_QUERY_KEYS_CONTRIBUTION) {
		console.log('[ERROR] Attempt to fetch filtered contributions by /api/contributions failed.\nReason: Expected 6 query parameters but only received ' + numKeys + '.');
		return res.send('must send all 6 query params');
	}

	// has exactly 6 query params
	// check if the 6 query params are the ones that i need

	// 1 Number query param (depth)
	if (!(REQ_DEPTH_KEYWORD in req.body)){
		console.log('[ERROR] Attempt to fetch filtered contributions by /api/contributions failed.\nReason: Expected a depth param but did not receive any.');
		return res.send('No depth query provided');
	}

	var QUERY_PARAM_DEPTH_STRING = req.body[REQ_DEPTH_KEYWORD];
	var isDepthParamEmpty = QUERY_PARAM_DEPTH_STRING.length <= 0;
	var isDepthParamNumber = !isNaN(parseInt(QUERY_PARAM_DEPTH_STRING));

	if (isDepthParamEmpty || !isDepthParamNumber) {
		console.log('[ERROR] Attempt to fetch filtered contributions by /api/contributions failed.\nReason: Expected depth param to be a Number but did not receive a Number.');
		return res.send('Depth query provided is not a number');
	}

	var requiredKeysWithoutDepth = [
																	REQ_GROUPS_KEYWORD,
																	REQ_USERS_KEYWORD,
																	REQ_RATING_KEYWORD,
																	REQ_TIME_KEYWORD,
																	REQ_TAGS_KEYWORD
																 ].sort();

	var sortedQueryKeys = Object.keys(req.body).sort();
	sortedQueryKeys.splice(sortedQueryKeys.indexOf(REQ_DEPTH_KEYWORD), 1); // remove the depth param

	var correctParams = requiredKeysWithoutDepth.reduce(function(acc, val, idx){
		return acc 
			&& (val == sortedQueryKeys[idx]) 
			&& (req.body[val].length > 0) // must not be blank queries for JSON.parse()
	}, true);

	if (!correctParams) {
		console.log('[ERROR] Attempt to fetch filtered contributions by /api/contributions failed.\nReason: Did not receive the exact expected params.');
		return res.send('Please send the correct 6 params');
	}

	next();
}

module.exports.initTempFileDest = function(req, res, next) {
	req.tempFileDest = './uploads/users/' + req.user.nusOpenId + '/temp/' + Date.now();
	next();
}

module.exports.ensureUserOwnsContribution = function(req, res, next){
	// ensure user owns the contribution id first
	var query = [
	'MATCH (c:contribution) WHERE ID(c)={contributionIdParam}',
	'RETURN c.createdBy as id'
	].join('\n');

	var params = {
		contributionIdParam: parseInt(req.params.contributionId)
	};

	db.query(query, params, function(error, result){
		if (error){
			console.log(error);
			res.send('error');
		} else {
			var contributionCreatorId = result[0].id;
			var userId = parseInt(req.user.id);

			if (userId === contributionCreatorId) {
				next();
			} else {
				res.status(500);
				res.send('not the owner');
			}
		}
	});
}

module.exports.getHandlerToSendImage = function(isForThumbnail) {
	return function(req, res, next){
		
		var query = [
			'OPTIONAL MATCH (c:contribution)-[:ATTACHMENT]-(a:attachment)',
			'WHERE ID(c)={contributionIdParam} AND ID(a)={attachmentIdParam}',
			'RETURN {count: count(a), name: a.name}'
		].join('\n');

		var params = {
			contributionIdParam: parseInt(req.params.contributionId),
			attachmentIdParam: parseInt(req.params.attachmentId)
		};

		var namePromise = new Promise(function(resolve, reject){
			db.query(query, params, function(error, result){
				if (error) {
					return reject('error');
				}

				if (result[0].count === 0) {
					return reject('error');
				}
				return resolve(result[0]);

			});
		});

		namePromise
		.then(function(result){
			var fileName = result.name;
			var filePath = glob.sync('./uploads/contributions/' + req.params.contributionId + '/attachments/' + (isForThumbnail ? 'thumbnails/' : '')  + fileName);
			res.sendFile(path.resolve(__dirname + '/../') + '/' + filePath[0]);	// sendFile does not like /../  ...
		})
		.catch(function(reason){
			console.log(reason);
			return res.send(reason);
		});

	}
}

module.exports.updateDatabaseWithAttachmentsAndGenerateThumbnails = function(req, res, next){
	// add attachments (can have multiple..)

	var contributionId = parseInt(req.contributionId || req.params.contributionId);

	if (req.files.length === 0) {
		// res.status(200);
		// return res.send('success');
		return;
	}

	// move the files
	var tempFileDest = req.tempFileDest;
	var attachmentsDest = './uploads/contributions/' + contributionId + '/attachments/';

	var transferPromise = new Promise(function(resolve, reject){
		fs.copy(tempFileDest, attachmentsDest, function(err){
			if (err) {
				console.error(err);
			} else {
				fs.remove(tempFileDest, function(err){
					resolve();
				})
			}
		});
	})
	.then(function(){

		return new Promise(function(resolve, reject){

			var createQueries = req.files.map((f, idx) =>
				' CREATE (a' + idx + ':attachment {dateUploaded: ' + Date.now() + ', size: ' + f.size + ', name: "' + f.filename + '", thumb:false })' +
				' CREATE (u)-[:UPLOADED]->(a' + idx + ')' +
				' CREATE (a' + idx + ')<-[:ATTACHMENT]-(c)'
				);

			var query = [
			'MATCH (u:user) WHERE ID(u)={userIdParam}',
			'MATCH (c:contribution) WHERE ID(c)={contributionIdParam}',
			];

			var returnQuery = req.files.reduce(function(acc, f, idx){
				return acc + (idx === 0 ? ' ' : '+') + 'collect(id(a' + idx + '))';
			}, 'RETURN ');

			returnQuery += ' as id';

			query = query.concat(createQueries, returnQuery);
			query = query.join('\n');

			var params = {
				userIdParam: req.user.id,
				contributionIdParam: contributionId
			};

			db.query(query, params, function(error, result){
				if (error){
					console.log(error);
				} else {
					resolve(result[0]);
				}
			});
		});

	})
	.then(function(idArray){
		// handle the thumbnail generation here
		var magic = new Magic(mmm.MAGIC_MIME_TYPE);
		req.files.map((f, idx) => {
			magic.detectFile(attachmentsDest + f.filename, function(err, result) {
				if (err) {
					console.log(err);
					return;
				}

				var isImage = result.split("/")[0] === "image";
				if (!isImage) {
					return;
				}

	      // create the /thumbnails folder if not exist yet
	      mkdirp(attachmentsDest + '/thumbnails/', function(err){
	      	if (err)
	      		console.log(err);
	      });

	      gm(attachmentsDest + f.filename)
	      .resize(300, 300, '^')
	      .gravity('Center')
	      .crop(200, 200)
	      .quality(100)
	      .write(attachmentsDest + '/thumbnails/' + f.filename, function(error){
	      	if (error) 
	      		console.log('error!!! for : ' + f.filename);
	      	else{
	      		var query = [
	      		'MATCH (a:attachment) WHERE ID(a)={attachmentIdParam}',
	      		'SET a.thumb = true'
	      		].join('\n');

	      		var params = {
	      			attachmentIdParam: idArray[idx],
	      		}

	      		db.query(query, params, function(error, result){
	      			if (error)
	      				console.log(error);
	      		});
	      	}
	      });
	    });
		})

	});
}
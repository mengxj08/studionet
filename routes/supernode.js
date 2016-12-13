var express = require('express');
var router = express.Router();
var auth = require('./auth');
var apiCall = require('./apicall');
var db = require('seraph')({
	server: process.env.SERVER_URL || 'http://localhost:7474/', // 'http://studionetdb.design-automation.net'
	user: process.env.DB_USER,
	pass: process.env.DB_PASS
});

var superNodeId = {
	id: -1
};

router.route('/')
	.get(auth.ensureAuthenticated, function(req, res){
		if (superNodeId.id !== -1){
			console.log('Sending cached supernode id');
			return res.send(superNodeId);
		}

		var query = [
			'MATCH (c:contribution {superNode: true})',
			'RETURN {id: id(c)}'
		].join('\n');

		db.query(query, function(error, result){
			if (error){
				console.log(error);
				return res.send('Cannot get the supernode id. Try again later.');
			}
			else {
				console.log('[SUCCESS] Successfully retrieved supernode id');
				superNodeId.id = result[0].id;
				return res.send(result[0]);
			}
		});

	})

module.exports = router;
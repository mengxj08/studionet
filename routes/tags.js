var express = require('express');
var router = express.Router();
var auth = require('./auth');
var db = require('seraph')({
	server: process.env.SERVER_URL || 'http://localhost:7474/', // 'http://studionetdb.design-automation.net'
	user: process.env.DB_USER,
	pass: process.env.DB_PASS
});

// route: /api/tags/
router.route('/')

	/*
	 * Returns the list of all tags with name, createdBy, contributionCount, id
	 */
	.get(auth.ensureAuthenticated, function(req, res){
		
		// return only name and id associated with each tag
		var query = [
			'MATCH (t:tag) WITH t',
			'OPTIONAL MATCH ()-[r:TAGGED]->(t)',
			'RETURN {name: t.name, createdBy: t.createdBy, contributionCount: count(r), id: id(t)}'
		].join('\n');

		db.query(query, function(error, result){
			if (error)
				console.log('Error retrieving all tags: ', error);
			else
				res.send(result);
		});

	})


module.exports = router;

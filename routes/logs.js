var express = require('express');
var router = express.Router();
var auth = require('./auth');
var db = require('seraph')({
	server: process.env.SERVER_URL || 'http://localhost:7474/', // 'http://studionetdb.design-automation.net'
	user: process.env.DB_USER,
	pass: process.env.DB_PASS
});

// route: /api/logs/
router.route('/')

	/*
	 * Returns the list of all tags with name, createdBy, contributionCount, id
	 */
	.get(auth.ensureAuthenticated, function(req, res){
		
		// return only name and id associated with each tag
		var query = [
			'MATCH (g) WHERE EXISTS(g.dateCreated)',
			'RETURN {name: g.name, title: g.title, dateCreated: g.dateCreated}'
		].join('\n');

		db.query(query, function(error, result){
			if (error)
				console.log('Error retrieving all logs: ', error);
			else
				res.send(result);
		});

	})


module.exports = router;

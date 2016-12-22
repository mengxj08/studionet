var express = require('express');
var router = express.Router();
var auth = require('./auth');
var apiCall = require('./apicall');
var db = require('seraph')({
  server: process.env.SERVER_URL || 'http://localhost:7474/', // 'http://studionetdb.design-automation.net'
  user: process.env.DB_USER,
  pass: process.env.DB_PASS
});


/*
 * Get all legal relationships
 */
var constants = require('../datastructure/constants.js');
var relationships = constants.relationships;


// route: /api/relationships
router.route('/')
	
	/*
	 * Returns a list of all legal relationships
	 */
	.get(auth.ensureAuthenticated, function(req, res){
		res.send(relationships);
	})

	.post(auth.ensureAuthenticated, function(req, res){

		/*
		 * 	Overrides - only for testing; remove later
		 */
		var createdByParam = parseInt(req.body.createdBy || req.user.id);

		// Create the relationship
		var query = [
			'MATCH (c:contribution) WHERE ID(c)=' + parseInt(req.body.source),
			'MATCH (c1:contribution) WHERE ID(c1)=' + parseInt(req.body.target),
			'MERGE (c)-[r:' + req.body.relationshipName + ']->(c1)',
			'SET r.createdBy=' + createdByParam + ', r.lastUpdated = ' + Date.now()
		].join('\n');

		db.query(query, function(error, result){
			if (error)
				console.log(error);
			else
				res.send("success creating the new relationship between " + req.body.source + " and " + req.body.target);
		})

	});

module.exports = router;
var express = require('express');
var router = express.Router();
var auth = require('./auth');
var apiCall = require('./apicall');
var db = require('seraph')({
	server: process.env.SERVER_URL || 'http://localhost:7474/', // 'http://studionetdb.design-automation.net'
	user: process.env.DB_USER,
	pass: process.env.DB_PASS
});

// route: /graph/all
router.route('/')

	// return whole graph
	.get(auth.ensureAuthenticated, function(req, res){

		// AKM - needs a direction or it sends double
		var query = [
									//'MATCH p=()-[]->() RETURN p'
									'MATCH p=(:contribution)-[*1]->(:contribution) RETURN p'
								].join('\n');

		apiCall(query, function(data){
			res.send(data);

		});

  });


// route: /graph/all/me
router.route('/me')

	// return only my network
	.get(auth.ensureAuthenticated, function(req, res){
		
		/*
		var query = [
									'MATCH (u:user) WHERE ID(u)=87',
									'MATCH (u)-[*1..2]-(a)',
									'RETURN u as user, collect(a) as things'
								].join('\n');
		*/

		var query = [
									'MATCH (u:user) WHERE ID(u)=' + req.user.id,
									'MATCH p=(u)-[*1..2]-()',
									'RETURN p'
								].join('\n');


		
		apiCall(query, function(data){
			res.send(data);

		});
	});

// route: /graph/all/groups
router.route('/groups')

	// return whole graph
	.get(auth.ensureAuthenticated, function(req, res){

		var query = [
						'MATCH (g:group) WITH g',
						'MATCH (g)-[s:SUBGROUP]->(m)',
						'RETURN s'
					].join('\n');
	
		apiCall(query, function(data){	
			res.send(data);
		});

});
		
module.exports = router;

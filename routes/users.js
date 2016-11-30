var express = require('express');
var router = express.Router();
var auth = require('./auth');
var apiCall = require('./apicall');
var db = require('seraph')({
	server: process.env.SERVER_URL || 'http://localhost:7474/', // 'http://studionetdb.design-automation.net'
	user: process.env.DB_USER,
	pass: process.env.DB_PASS
});


// route: /api/users
router.route('/')

	// return all users
	.get(auth.ensureAuthenticated, auth.ensureSuperAdmin, function(req, res){

		/*
		var query = "MATCH path=(u:user)-[:CREATED|VIEWED|UPLOADED|MEMBER*0..1]-(p)\nRETURN path";

		apiCall(query, function(data){
			res.send(data);
		});
		*/
		
		var query = [
			'MATCH (u:user) WITH u',
			'OPTIONAL MATCH (u)-[c:CREATED]->(p) WITH u, collect({id: id(p), contributionTypes: p.contributionTypes}) AS contributions',
			'OPTIONAL MATCH (u)-[v:VIEWED]->(e) WITH u, contributions, collect({count: v.count, id: id(e)}) AS views',
			'OPTIONAL MATCH (u)-[r:UPLOADED]->(f) WITH u, contributions, views, collect({id: id(f), type:f.type}) AS uploads',
			'OPTIONAL MATCH (m)-[z:MEMBER]->(u) WITH u, contributions, views, uploads, collect({role: z.role, id: id(m)}) AS modules',
			'RETURN {id: id(u), year: u.year, nusOpenId: u.nusOpenId, canEdit: u.canEdit, name: u.name, lastLoggedIn: u.lastLoggedIn, avatar: u.avatar, superAdmin: u.superAdmin, contributions: contributions, views: views, uploads: uploads, modules: modules}'
		].join('\n');


		db.query(query, function(error, result){
			if (error)
				console.log('Error retrieving all users: ', error);
			else
				res.send(result);
		});

	})

	// add a new user
	.post(auth.ensureAuthenticated, function(req, res){

		// TODO: check if openID exists
		
		var query = [
			'CREATE (u:user {name: {nameParam}, nusOpenId: {nusOpenIdParam},' + 
			'canEdit: {canEditParam},' + /*year: {yearParam},*/ 
			'addedBy: {addedByParam}, addedOn: {addedOnParam},' +
			'lastLoggedIn: {lastLoggedInParam}, superAdmin: {superAdminParam}})',
			'RETURN u'
		].join('\n');

		var params = {
			nameParam: req.body.name,
			nusOpenIdParam: req.body.nusOpenId,
			canEditParam: true,//req.body.canEdit,
			//yearParam: req.body.year,
			lastLoggedInParam: 0,//Date.now(),
			superAdminParam: false, 
			addedByParam: req.user.id,
			addedOnParam: Date.now()
		};

		/*
		 *
		 *	Only for testing and creating synthetic data; 
		 *	Remove in production
		 *
		 * 
		 */
		if(auth.ensureSuperAdmin && req.body.addedBy && req.body.addedOn){

			params.addedByParam = parseInt(req.body.addedBy);
			params.addedOnParam = new Date(req.body.addedOn).getTime();

		}

		db.query(query, params, function(error, result){
			if (error)
				console.log('Error creating new user: ', error);
			else
				res.send(result[0]);
		});

	});

// route: /api/users/:userId
router.route('/:userId')

	// return a user
	.get(auth.ensureAuthenticated, function(req, res){

			var query = "MATCH path=(u:user)-[*0..1]-(p) WHERE id(u)=" + req.params.userId +"\nRETURN path";
			apiCall(query, function(data){
				res.send(data);
			})


			/*
			var query = [
				'MATCH (u:user) WHERE ID(u)='+req.params.userId+ ' WITH u',
				'MATCH (a)-[r]-(u)',
				'RETURN a,r,u'
				/*
				'OPTIONAL MATCH (u)-[c:CREATED]->(p) WITH u, collect({id: id(p), contributionTypes: p.contributionTypes}) AS contributions',
				'OPTIONAL MATCH (u)-[v:VIEWED]->(e) WITH u, contributions, collect({count: v.count, id: id(e)}) AS views',
				'OPTIONAL MATCH (u)-[r:UPLOADED]->(f) WITH u, contributions, views, collect({id: id(f), type:f.type}) AS uploads',
				'OPTIONAL MATCH (m)-[z:MEMBER]->(u) WITH u, contributions, views, uploads, collect({role: z.role, id: id(m)}) AS modules',
				'RETURN {id: id(u), year: u.year, nusOpenId: u.nusOpenId, canEdit: u.canEdit, name: u.name, lastLoggedIn: u.lastLoggedIn, avatar: u.avatar, superAdmin: u.superAdmin, contributions: contributions, views: views, uploads: uploads, modules: modules}'
				
			].join('\n');

			db.query(query, function(error,result){
				if (error)
					console.log('Error getting user of id ' + req.params.userId + ' : ' + error);
				else
					res.send(result);
			});	
			*/
	})

	// update a user
	.put(auth.ensureAuthenticated, auth.ensureSuperAdmin, function(req, res){
		var query = [
			'MATCH (u:user) WHERE ID(u)=' + req.params.userId,
			'SET u.name={nameParam}, u.nusOpenId={nusOpenIdParam}, u.canEdit={canEditParam}, u.year={yearParam}',
			'RETURN u'
		].join('\n');

		var params = {
			nameParam: req.body.name,
			nusOpenIdParam: req.body.nusOpenId,
			canEditParam: req.body.canEdit,
			yearParam: req.body.year,
		};

		db.query(query, params, function(error, result){
			if (error)
				console.log('Error creating new user: ', error);
			else
				res.send(result[0]);
		});
	})

	// delete a user
	.delete(auth.ensureAuthenticated, auth.ensureSuperAdmin, function(req, res){
		var query = [
			'MATCH (u:user) WHERE ID(u)=' + req.params.userId,
			'DELETE u'
		].join('\n');

		db.query(query, function(error,result){
			if (error)
				console.log('Error deleting user id: ' + req.params.userId);
			else
				res.send(result[0]);
		})
	});


module.exports = router;

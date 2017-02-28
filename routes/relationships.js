var express = require('express');
var router = express.Router();
var auth = require('./auth');
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

		// Create the relationship
		var query = [
			'MATCH (u:user) WHERE ID(u)={userIdParam}',
			'CREATE (l:link)<-[:CREATED]-(u)',
			'WITH l',
			'MATCH (c:contribution) WHERE ID(c)={sourceIdParam}',
			'WITH l, c',
			'MATCH (c1:contribution) WHERE ID(c1)={targetIdParam}',
			'WITH l, c, c1',
			'MERGE (c)-[r:RELATED_TO]->(c1)',
			'SET l.ref=ID(r), l.createdBy=8, l.createdAt={dateParam}, l.likes = 0, l.note={noteParam}',
			'RETURN ID(r) as id'
		].join('\n');

		var params = {
			userIdParam: parseInt(req.user.id), 
			sourceIdParam : parseInt(req.body.source), 
			targetIdParam : parseInt(req.body.target),
			noteParam : req.body.note,
			dateParam : Date.now()
		};

		db.query(query, params, function(error, result){
			if (error)
				console.log(error);
			else{
				req.app.get('socket').emit('edge_created', { source: req.body.source , target: req.body.target, id: result[0].id } );
				res.send("success creating the new relationship between " + req.body.source + " and " + req.body.target);
			}
		})

	});

// route: /api/relationships/:relationshipId
router.route('/:relationshipId')
	.get(auth.ensureAuthenticated, function(req, res){
		var query = [
			'MATCH (:contribution)-[r]->(:contribution)',
			'WHERE ID(r)={relationshipIdParam}',
			'RETURN r'
		].join('\n');

		var params = {
			relationshipIdParam: parseInt(req.params.relationshipId)
		};

		db.query(query, params, function(error, result){
			if (error) {
				console.log(error);
				res.status(500);
				return res.send('error');
			}
			res.status(200);
			return res.send(result[0]);
		});

	})

	.delete(auth.ensureAuthenticated, function(req, res, next){
		// check if the relationship was created by the user
		var query = [
			'MATCH (:contribution)-[r]->(:contribution)',
			'WHERE ID(r)={relationshipIdParam}',
			'RETURN {createdBy: r.createdBy}'
		].join('\n');

		var params = {
			relationshipIdParam: parseInt(req.params.relationshipId)
		};

		db.query(query, params, function(error, result){
			if (error) {
				console.log(error);
				res.status(500);
				return res.send('error');
			}
			if (parseInt(result[0].createdBy) !== parseInt(req.user.id)) {
				res.status(500);
				return res.send('relationship not created by you');
			}
			next();
		});
	}, function(req, res){

		// delete the relationship here
		var query = [
			'MATCH (:contribution)-[r]->(:contribution)',
			'WHERE ID(r)={relationshipIdParam}',
			'DELETE r'
		].join('\n');

		var params = {
			relationshipIdParam: parseInt(req.params.relationshipId)
		};

		db.query(query, params, function(error, result){
			if (error) {
				console.log(error);
				res.status(500);
				return res.send('error');
			}
			res.status(200);
			return res.send('success in deleting relationship id: ' + req.params.relationshipId);
		});
	});
module.exports = router;
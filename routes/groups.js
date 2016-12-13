var express = require('express');
var router = express.Router();
var auth = require('./auth');
var apiCall = require('./apicall');
var db = require('seraph')({
	server: process.env.SERVER_URL || 'http://localhost:7474/', // 'http://studionetdb.design-automation.net'
	user: process.env.DB_USER,
	pass: process.env.DB_PASS
});


// might change routes to use a better middleware

// route: /api/groups/
router.route('/')

	// return all groups
	.get(auth.ensureAuthenticated, function(req, res){
		
		var query = [
			'MATCH (g:group)',
			'OPTIONAL MATCH (g)<-[:SUBGROUP]-(p:group)',
			'OPTIONAL MATCH (g)-[:MEMBER]->(m1:user)',
			'RETURN {name: g.name, id: id(g), restricted: g.restricted, parentId: id(p), users: count(m1), createdBy: g.createdBy}'
		].join('\n'); 

		db.query(query, function(error, result){
			if (error){
				console.log('Error retrieving all groups: ', error);
			}
			else{
				res.send(result);
			}
		});

	})

	// create a new group
	.post(auth.ensureAuthenticated, function(req, res){
		// TODO: more details for a group?
		// avatar, etc.
		// Param setup
		var params = {
			nameParam: req.body.name,
			descriptionParam: req.body.description,
			restrictedParam: req.body.restricted,
			groupParentIdParam: parseInt(req.body.groupParentId),
			userIdParam: parseInt(req.user.id),
			dateCreatedParam: Date.now()
		};

		var countQuery = [
			'OPTIONAL MATCH (g:group {name: {nameParam}})',
			'OPTIONAL MATCH (t:tag {name: {nameParam}})',
			'RETURN {count: count(g)+count(t)}'
		].join('\n');

		var countPromise = new Promise(function(resolve, reject){
			db.query(countQuery, params, function(error, result){
				if (error){
					console.log('Error looking for the group in database: ', error);
					res.send('Error looking for group in database');
					reject();
				}
				else {
					resolve(result);
				}
			});
		});

		countPromise
		.then(function(result){
			var invalidName = result.count > 0;

			if (invalidName){
				return res.send('Error: This group name is invalid because a group or tag with that name already exists');
			}

			var query = [
				'CREATE (g:group {createdBy: {userIdParam}, name: {nameParam}, description: {descriptionParam}, restricted: {restrictedParam}, dateCreated: {dateCreatedParam}})',
				'WITH g',
				'MATCH (u:user) WHERE id(u)= {userIdParam}',
				'CREATE UNIQUE (g)-[r:MEMBER {role: "Admin", joinedOn: ' + params.dateCreatedParam + '}]->(u)',
				'CREATE (t:tag {name: {nameParam}, createdBy: {userIdParam}})',
				'WITH g, t',
				'CREATE UNIQUE (g)-[r1:TAGGED]->(t)',
			];

			if (params.groupParentIdParam !== -1) {
				query.push('WITH g');
				query.push('MATCH (g1:group) WHERE id(g1)= {groupParentIdParam}');
				query.push('CREATE UNIQUE (g1)-[r2:SUBGROUP]->(g)');
			}

			query.push('RETURN g');
			query = query.join('\n');


			/*
			 *
			 *	For testing and creating synthetic data 
			 *	Remove in production
			 * 
			 */
			if(auth.ensureSuperAdmin && req.body.author && req.body.createdAt){

				params.userIdParam = parseInt(req.body.author);		// remove in production
				params.dateCreatedParam = new Date(req.body.createdAt).getTime();
			}

			/*
			 *	Actual creating of group using above query
			 */ 
			db.query(query, params, function(error, result){
				if (error){
					console.log('Error occured while creating the group in the database: ', error);
					res.send('Error');
				}
				else {
					// return the first item because query always returns an array but REST API expects a single object
					res.send(result[0]);
				}

			});

		});

	});


// route: /api/groups/:groupId
router.route('/:groupId')

	// returns a particular group
	.get(auth.ensureAuthenticated, function(req, res){

		var query = [
			'MATCH (g:group) WHERE ID(g) = {groupIdParam}',
			'OPTIONAL MATCH (u:user)<-[:MEMBER]-(g)' ,
			'RETURN {name: g.name, id: id(g), description: g.description, restricted: g.restricted, createdBy: g.createdBy, users: COUNT(u)}'
		].join('\n');

		var params = {
			groupIdParam : parseInt(req.params.groupId)
		};
		
		db.query(query, params, function(error, result){

			if (error)
				console.log('Error retreiving group ' + req.params.groupId + ':', error);
			else
				res.send(result[0]);

		});

	})

	// updates an existing group
	.put(auth.ensureAuthenticated, auth.isGroupAdmin, function(req, res){

		// ensure the new group name does not alr exist as another grp/tag name
		var countQuery = [
			'OPTIONAL MATCH (g:group {name: {nameParam}})',
			'OPTIONAL MATCH (t:tag {name: {nameParam}})',
			'RETURN {count: count(g)+count(t)}'
		].join('\n');

		var countPromise = new Promise(function(resolve, reject){
			db.query(countQuery, params, function(error, result){
				if (error){
					console.log('Error looking for the group in database: ', error);
					res.send('Error looking for group in database');
					reject();
				}
				else {
					resolve(result);
				}
			});
		});

		countPromise
		.then(function(result){

			var invalidName = result.count > 0;

			if (invalidName){
				return res.send('Error: This group name is invalid because a group or tag with that name already exists');
			}

			var query = [
				'MATCH (g:group)',
				'WHERE ID(g)={groupIdParam}',
				'MATCH (g)-[r:TAGGED]->(t)',
				'SET g.name={nameParam}, g.description={descriptionParam}, g.restricted={restrictedParam}, t.name={nameParam}',
				'RETURN g'
			].join('\n');

			var params = {
				groupIdParam: parseInt(req.params.groupId),
				nameParam: req.body.name,
				descriptionParam: req.body.description,
				restrictedParam: req.body.restricted
			};

			db.query(query, params, function(error, result){
				if (error)
					console.log('Error updating group with id ' + req.params.groupId + ' : ', error);
				else
					// return the first item because query always returns an array but REST API expects a single object
	 				res.send(result[0]);
			});


		});

	})

	// deletes an existing group
	.delete(auth.ensureAuthenticated, auth.ensureSuperAdmin, function(req, res){
		var query = [
			'MATCH (g:group)',
			'WHERE ID(g)={groupIdParam}',
			'DETACH DELETE g'
		].join('\n');

		var params = {
			groupIdParam: parseInt(req.params.groupId)
		}

		db.query(query, params, function(error, result){
			if (error)
				console.log('Error deleting group with id ' + req.params.groupId + ' : ', error);
			else
				// return the first item because query always returns an array but REST API expects a single object
				res.send(result[0]);
		})
	});


// route: /api/groups/:groupId/users
router.route('/:groupId/users')
	
	// get all users for this group (all roles)
	.get(auth.ensureAuthenticated, function(req, res){
		
		var query = [
			'MATCH (g:group) WHERE ID(g) = {groupIdParam}',
			'MATCH (g)-[r:MEMBER]->(u:user)',
			'RETURN {name: u.name, nusOpenId: u.nusOpenId, id: id(u), role: r.role}'
		].join('\n');

		var params = {
			groupIdParam: parseInt(req.params.groupId)
		};

		db.query(query, params, function(error, result){
			if (error)
				console.log('Error fetching list of users for group ', req.params.groupId, error);
			else
				res.send(result);
		});

	})

	/*
	 * Add a user to the group (allow for array of users)
	 */ 
	.post(auth.ensureAuthenticated, auth.isGroupAdmin, function(req, res){

		// req.body.users (object with id, role)
		var members = JSON.parse(req.body.users)
											.filter(u => u.role === "Admin")
											.map(u => parseInt(u.id));

		var admins = JSON.parse(req.body.users)
										 .filter(u => u.role === "Member")
										 .map(u => parseInt(u.id));

		var query = [
			'MATCH (u:user) WHERE ID(u)=[' + members + ']',
			'MATCH (u1:user) WHERE ID(u1)=[' + admins + ']',
			'MATCH (g:group) WHERE ID(g)={groupIdParam}',
			'CREATE UNIQUE (g)-[r:MEMBER{role: "Member"}]->(u)',
			'CREATE UNIQUE (g)-[r:MEMBER{role: "Admin"}]->(u1)',
			'RETURN g'
		].join('\n');
	
		var params = {
			groupIdParam: parseInt(req.params.groupId)
		};

		db.query(query, params, function(error, result){
			if (error)
				console.log('Error linking the user to the group');
			else
				res.send('success');
		});
	})

	/*
	 * Delete a user to the group (allow for array of users)
	 */ 
	.delete(auth.ensureAuthenticated, auth.isGroupAdmin, function(req, res){

		var userIds = JSON.parse(req.body.userIds).map(x => parseInt(x));

		var query = [
			'MATCH (u:user) WHERE ID(u)=[' + userIds + ']',
			'MATCH (g:group) WHERE ID(g)={groupIdParam}',
			'MATCH (g)-[r:MEMBER]->(u)',
			'DELETE r'
		].join('\n');
	
		var params = {
			groupIdParam: parseInt(req.params.groupId)
		};

		db.query(query, params, function(error, result){
			if (error){
				console.log('Error linking the user to the group');
				res.send('Error deleting users from group');
			}
			else{
				res.send('Successfully deleted users from the group');
			}
		});

	});



// route: /api/groups/graph
router.route('/:groupId/users/:userId')
	// edit the user's role in this group
	.put(auth.ensureAuthenticated, auth.isGroupAdmin, function(req, res){
		var query = [
			'MATCH (g:group)-[r:MEMBER]->(u:user)',
			'WHERE ID(g)={groupIdParam} AND ID(u)={userIdParam}',
			'SET r.role ={roleParam}'
		].join('\n');

		var params = {
			groupIdParam: parseInt(req.params.groupId),
			userIdParam: parseInt(req.params.userId),
			roleParam: req.body.groupRole
		};

		db.query(query, params, function(error, result){
			if (error)
				console.log('Error editting role of user for this group');
			else
				res.send('success');
		});
	});


module.exports = router;

var express = require('express');
var router = express.Router();
var auth = require('./auth');
var apiCall = require('./apicall');
var db = require('seraph')({
  server: process.env.SERVER_URL || 'http://localhost:7474/', // 'http://studionetdb.design-automation.net'
  user: process.env.DB_USER,
  pass: process.env.DB_PASS
});
var _ = require('underscore');


// route: /api/groups/
router.route('/')

	// return all groups
	.get(auth.ensureAuthenticated, function(req, res){
		
		/*
		 *	Returns id, name, restricted, parentId, createdBy, requestingUserStatus
		 *	Contextual to the user who is making the request (requesting user status)
		 * 
		 */
		
		var query = [
			'MATCH (g:group)',
			'MATCH (u:user) WHERE ID(u)={userIdParam}',
			'OPTIONAL MATCH (g)<-[:SUBGROUP]-(p:group)',
			'OPTIONAL MATCH (u)<-[m:MEMBER]-(g)',
			'RETURN {supernode: g.superNode, id: id(g), restricted: g.restricted, parentId: id(p), name: g.name, requestingUserStatus: m.role, description: g.description}'
		].join('\n'); 

		var params = {
			userIdParam : parseInt(req.user.id)
		}

		db.query(query, params, function(error, result){
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
          res.status(500);
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
      var invalidName = result[0].count > 0;

      
      if (invalidName){
        res.status(406);
        return res.send('Error: This group name is invalid because a group or tag with that name already exists');
      }

      var mainQuery = [
        'CREATE (g:group {createdBy: {userIdParam}, name: {nameParam}, description: {descriptionParam}, restricted: {restrictedParam}, dateCreated: {dateCreatedParam}})',
        'WITH g',
        'MATCH (u:user) WHERE id(u)= {userIdParam}',
        'CREATE UNIQUE (g)-[r:MEMBER {role: "Admin", joinedOn: ' + params.dateCreatedParam + '}]->(u)',
        'CREATE (t:tag {name: {nameParam}, createdBy: {userIdParam}})',
        'WITH g, t, u',
        'CREATE UNIQUE (g)-[r1:TAGGED {createdBy: ' + parseInt(req.user.id) + '}]->(t)',
        'CREATE UNIQUE (u)-[:CREATED {createdOn: ' + Date.now() + '}]->(t)'
      ];

      var parentQuery = [];
      var finalQuery = ['RETURN g'];

      if (params.groupParentIdParam !== -1) {

        parentQuery = [
          'WITH g',
          'MATCH (g1:group) WHERE id(g1)= {groupParentIdParam}',
          'CREATE UNIQUE (g1)-[r2:SUBGROUP]->(g)',
          'WITH g, CASE WHEN g1.restricted = true THEN [1] ELSE [] END as array',
          'FOREACH (x in array | SET g.restricted=true)'
        ];

      }

      var query = mainQuery.concat(parentQuery, finalQuery).join('\n');

      /*
       *
       *  For testing and creating synthetic data 
       *  Remove in production
       * 
       */
      if(auth.ensureSuperAdmin && req.body.author && req.body.createdAt){

        params.userIdParam = parseInt(req.body.author);   // remove in production
        params.dateCreatedParam = new Date(req.body.createdAt).getTime();
      }

      /*
       *  Actual creating of group using above query
       */ 
      db.query(query, params, function(error, result){
        if (error){
          res.status(500);
          console.log('Error occured while creating the group in the database: ', error);
          res.send('Error occured while creating the group in the database: ');
        }
        else {
          // return the first item because query always returns an array but REST API expects a single object
          res.status(200);
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
      'OPTIONAL MATCH (u:user)<-[r:MEMBER]-(g)',
      'WITH count(u) as numUsers, collect({id: id(u), role: r.role, name: u.name}) as users, g',
      'OPTIONAL MATCH (g:group)<-[:SUBGROUP]-(g1)',
      'WITH numUsers, g, id(g1) as parentId, users',
      'RETURN {name: g.name, id: id(g), description: g.description, restricted: g.restricted, createdBy: g.createdBy, users: users, numUsers: numUsers, parentId: parentId}'
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

    var params = {
      nameParam: req.body.name
    }

    var countPromise = new Promise(function(resolve, reject){
      db.query(countQuery, params, function(error, result){
        if (error){
          console.log('Error looking for the group in database: ', error);
          return res.send('Error looking for group in database');
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
        if (error) {
          console.log('Error updating group with id ' + req.params.groupId + ' : ', error);
          res.send(error);
        }
        else {
          // return the first item because query always returns an array but REST API expects a single object
          res.send(result[0]);
        }
      });


    });

  })

  // deletes an existing group
  .delete(auth.ensureAuthenticated, auth.ensureSuperAdmin, function(req, res){
    var query = [
      'MATCH (g:group)',
      'WHERE ID(g)={groupIdParam}',
      'MATCH (t:tag)<-[:TAGGED]-(g)',
      'WITH t,g',
      'DETACH DELETE g',
      'WITH t',
      'OPTIONAL MATCH (t)<-[r1:TAGGED]-()',
      'WITH t, CASE WHEN count(r1) > 0 THEN [] ELSE [1] END as array',
      'FOREACH (x in array | DETACH DELETE t)',
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
   * Add users to the group (must be an admin of the group, allow for array of users)
   */ 
  .post(auth.ensureAuthenticated, auth.isGroupAdmin, function(req, res){

    // if this group is a subgroup, first check if the specified users are part of the parent group
    // return all users of the parent group and cross check with given user ids
    var parentQuery = [
      'MATCH (g:group) WHERE ID(g)={groupIdParam}',
      'OPTIONAL MATCH (g)<-[:SUBGROUP]-(g1:group)',
      'WITH g1, CASE WHEN g1 IS NULL THEN false ELSE true END as hasParent',
      'OPTIONAL MATCH (u:user)<-[r:MEMBER]-(g1)',
      'RETURN {hasParent: hasParent, userIds: collect(id(u))}'
    ].join('\n');

    var params = {
      groupIdParam: parseInt(req.params.groupId)
    };

    var parentPromise = new Promise(function(resolve, reject){
      db.query(query, params, function(error, result){
        if (error){
          console.log(error);
          res.send('Error checking if users are in the parent of this group');
          reject(error);
        }
        else {
          resolve(result);
        }
      });
    });

    parentPromise
    .then(function(result){

      var usersInParent = result.userIds;
      var hasParent = result.hasParent;
      console.log('has parent: ' + hasParent);
      console.log('users in the parent group' + usersInParent);

      var invalidUsers = [];

      if (hasParent) {

        var givenUserIds = JSON.parse(req.body.users)
                               .map(u => parseInt(u.id));

        var validUserIdsToAdd = _.intersection(usersInParent, givenUserIds);
        invalidUsers = _.difference(givenUserIds, validUserIdsToAdd);

        var validUsersToAdd = JSON.parse(req.body.users)
                                  .filter(u => validUserIdsToAdd.includes(u.id));

        var admins = validUserIdsToAdd.filter(u => u.role === "Admin")
                                      .map(u => parseInt(u.id));

        var members = validUserIdsToAdd.filter(u => u.role === "Member")
                                       .map(u => parseInt(u.id));

      } else {

        // req.body.users (object with id, role)
        var admins = JSON.parse(req.body.users)
                          .filter(u => u.role === "Admin")
                          .map(u => parseInt(u.id));

        var members = JSON.parse(req.body.users)
                          .filter(u => u.role === "Member")
                          .map(u => parseInt(u.id));
      }

      var query = [
        'MATCH (u:user) WHERE ID(u) IN [' + members + ']',
        'MATCH (u1:user) WHERE ID(u1) IN [' + admins + ']',
        'MATCH (g:group) WHERE ID(g)={groupIdParam}',
        'CREATE UNIQUE (g)-[r:MEMBER{role: "Member"}]->(u)',
        'CREATE UNIQUE (g)-[r:MEMBER{role: "Admin"}]->(u1)',
        'RETURN g'
      ].join('\n');
    
      db.query(query, params, function(error, result){
        if (error){
          console.log('Error linking the user to the group');
          return res.send('Error linking users to the group');
        }
        else
          return res.send('Successfully added admins: ' + admins + ', and members: ' + members + '.\
            \nThe following users could not be added to the group as they are not members of the parent: ' + invalidUsers);
      });

    })

  })

  /*
   * Delete a user to the group (allow for array of users)
   */ 
  .delete(auth.ensureAuthenticated, auth.isGroupAdmin, function(req, res){

    // req.body.userIds (array of user ids)
    var userIds = JSON.parse(req.body.userIds)
                      .map(x => parseInt(x));

    var query = [
      'MATCH (u:user) WHERE ID(u) IN [' + userIds + ']',
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



// route: /api/groups/:groupId/join
router.route('/:groupId/join')
  // manually join an open (not restricted) group as a user
  .get(auth.ensureAuthenticated, function(req, res){

    // if it has a parent then user must first be a member of the parent group
    var parentQuery = [
      'OPTIONAL MATCH (g:group)<-[:SUBGROUP]-(g1:group) WHERE ID(g)={groupIdParam}',
      'WITH CASE WHEN g1 is NULL THEN false ELSE true END as hasParent, g1, g.restricted as isRestricted',
      'OPTIONAL MATCH p=(u:user)<-[:MEMBER]-(g1) WHERE ID(u)={userIdParam}',
      'WITH hasParent, g1, CASE WHEN p IS NULL THEN false ELSE true END as isMemberOfParent, isRestricted',
      'RETURN {hasParent: hasParent, isMemberOfParent: isMemberOfParent, isRestricted: isRestricted}'
    ].join('\n');

    var params = {
      userIdParam: req.user.id,
      groupIdParam: parseInt(req.params.groupId)
    };

    var parentPromise = new Promise(function(resolve, reject){
      db.query(parentQuery, params, function(error, result){
        if (error){
          console.log(error);
          reject(error);
          res.send('Error joining the group');
        } else {
          resolve(result);
        }
      });
    });

    parentPromise
    .then(function(result){
      var hasParent = result.hasParent;
      var isMemberOfParent = result.isMemberOfParent;
      var isRestricted = result.isRestricted;

      if (isRestricted){
        return res.send('Cannot join a restricted group manually.')
      }

      if (hasParent && !isMemberOfParent){
        return res.send('Must be a member of the parent of this group to join this subgroup');
      }

      // just add the user to the group (as a member)
      var query = [
        'MATCH (u:user) WHERE ID(u)={userIdParam}',
        'MATCH (g:group) WHERE ID(g)={groupIdParam}',
        'MERGE (g)-[r:MEMBER {role: "Member", joinedOn: ' + Date.now() + '}]->(u)'
      ].join('\n');

      db.query(query, params, function(error, result){
        if (error){
          console.log(error);
          return res.send('Error joining the group');
        }
        else {
          console.log('Successfully added user'+ req.user.id + 'to the group id: ' + req.params.groupId);
          return res.send('Successfully joined group');
        }
      });

    });

  });

router.route('/:groupId/leave')
  // leave the group if the user is currently in the group
  .get(auth.ensureAuthenticated, function(req, res){
    var query = [
      'MATCH (u:user)<-[r:MEMBER]-(g:group)',
      'WHERE ID(u)={userIdParam} AND ID(g)={groupIdParam}',
      'DELETE r'
    ].join('\n');

    var params = {
      userIdParam: req.user.id,
      groupIdParam: parseInt(req.params.groupId)
    };

    db.query(query, params, function(error, result){
      if (error){
        console.log(error);
        res.send('error leaving group');
      }
      else {
        console.log('Successfully left the group');
        res.send('Successfully left the group');
      }
    })

  });


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
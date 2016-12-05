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

// route: /api/contributions
router.route('/')
	/*
	 * Returns all contributions, including the name, created by, created on and id of the contribution.
	 */
	.get(function(req, res){

		var numKeys = Object.keys(req.query).length;
		var hasParams = (numKeys > 0) ? true : false;
		var NUM_QUERY_KEYS_CONTRIBUTION = 6;

		if (!hasParams) {
			var query = [
				'MATCH (c:contribution)',
				'WITH c',
				'RETURN ({title: c.title, createdBy: c.createdBy, dateCreated: c.dateCreated, id: id(c)})'		
			].join('\n');

			db.query(query, function(error, result) {
				if (error)
					console.log('Error fetching all contributions in the database');
				else
					res.send(result);
			});
			return;

		}

		if (numKeys !== NUM_QUERY_KEYS_CONTRIBUTION) {
			console.log('Error, must send all 6 query params');
			res.send('must send all 6 query params');
			return;
		}

		// has exactly 6 query params
		// check if the 6 query params are the ones that i need

		// 1 Number query param (depth)
		if (!('d' in req.query)){
			console.log('No depth query provided');
			res.send('No depth query provided');
			return;
		}

		if (req.query['d'].length <= 0 || isNaN(parseInt(req.query['d']))) {
			console.log('Depth query provided is not a number');
			res.send('Depth query provided is not a number');
			return;
		}

		// 5 array query params
		var requiredKeysWithoutDepth = ['g', 'u', 'r', 't', 'tg'].sort();
		var queryKeys = Object.keys(req.query).sort();
		queryKeys.splice(queryKeys.indexOf('d'), 1);

		var correctParams = requiredKeysWithoutDepth.reduce(function(acc, val, idx){
			console.log(JSON.parse(req.query[val]));
			return acc 
				&& (val == queryKeys[idx]) 
				&& (req.query[val].length > 0) // must not be blank queries for JSON.parse()
				&& (JSON.parse(req.query[val]) instanceof Array); // must be an array
		}, true);

		if (!correctParams) {
			res.send('Please send the correct 6 params');
			return;
		}

		console.log(correctParams);
		//res.send('Ok good params');

		// First get all the users matching the specified group, if present
		var groupIds = JSON.parse(req.query['g']).map(x => parseInt(x));
		var query = [ 
			'MATCH (g:group) WHERE ID(g) IN {groupIdParam}',
			'MATCH (u:user)<-[r:MEMBER]-(g)',
			'RETURN collect(distinct id(u))'
		].join('\n');

		var groupQueryParam = {
			groupIdParam: groupIds
		};

		console.log(groupQueryParam.groupIdParam);

		var usersInGroups = [];
		var usersInGroupsPromise = new Promise(function(resolve, reject){
			db.query(query, groupQueryParam, function(error, result){
				if (error) {
					console.log('Error getting users for group ids: ' + groupIds);
					reject('Error getting users for group ids: ' + groupIds);
				} else {
					console.log('Success in getting users for the group ids: ' + groupIds);
					resolve(result[0]);
				}
			});
		});

		usersInGroupsPromise
		.then(function(result){
			var specifiedUserIds = JSON.parse(req.query['u']).map(x => parseInt(x));
			var dateArray = JSON.parse(req.query['t']).map(x=>parseInt(x));
			var params = {
				userIdsParam: _.union(specifiedUserIds, result),
				dateLowerParam: dateArray[0],
				dateUpperParam: dateArray[1],
				tagIdsParam: JSON.parse(req.query['tg']).map(x => parseInt(x)),
				depthParam: parseInt(req.query['d'])
			};

			var query = [
				'MATCH (u:user) WHERE ID(u) IN [' + params.userIdsParam + ']',
				'WITH u',
				'MATCH (c:contribution)<-[r:CREATED]-(u)',
				'WHERE toInt(c.dateCreated) >= toInt(' + params.dateLowerParam + ')',
				'AND toInt(c.dateCreated) <= toInt('+ params.dateUpperParam +')',
				'WITH c',
				'MATCH (c)-[r:TAGGED]->(t:tag) WHERE ID(t) IN [' + params.tagIdsParam + ']',
				'WITH c',
				'MATCH (c)-[*' + params.depthParam + ']-(c2:contribution)',
				'WITH collect(c)+collect(c2) as combinedContributionsCollection',
				'UNWIND combinedContributionsCollection AS combinedContribution',
				'UNWIND combinedContributionsCollection AS combinedContribution2',
				'MATCH p=(combinedContribution)-[*0..1]-(combinedContribution2)',
				'WITH combinedContribution, p',
				'MATCH q=(combinedContribution)-[]->(:contribution {superNode: true})',
				'RETURN distinct (collect(p) + collect(q))'
			].join('\n');

			console.log(query);

			apiCall(query, function(data) {
				var nodes = [], links = [];
      
	      data.forEach(function(row){
	        // for each graph

	        row.graph.nodes.forEach(function(n) {
	          if (idIndex(nodes, n.id) == null)
	              nodes.push({
	                  id: n.id,
	                  type: n.labels[0],
	                  name: setName(n),
	              });
	        });
	        links = links.concat(row.graph.relationships.map(function(r) {
	            return {
	                source: idIndex(nodes, r.startNode).id,   // should not be a case where start or end is null.
	                target: idIndex(nodes, r.endNode).id,
	                name: r.type
	            };
	        }));
	      });

	      res.send({nodes: nodes, links: links});
			});


		})
		.catch(function(reason){
			console.log(reason);
			res.send(reason);
		});


		// Combine users to get all users required

		// Get contributions matched for these users under the given constraints
		// Tag, Rating, Depth, Time
	})

	/*
	 * Creates a new contribution linked to the current user.
	 *
	 * req.author : profile.user.id;
	 * req.title : Contribution's Title
	 * req.body : Contribution's Content
	 * req.tags : Array - Contribution's tags
	 * To-do: Once a new tag is specified for the created contribution, this new tag should be sent to DB as well
	 * 
	 * req.ref : the being created contribution's parent (reply to ... )  
	 * 
	 * Links created:
	 * Reference link -  Might link itself to another contribution if ref != -1
	 * Tag link - Links itself to the tags specified in the req body, creating them if necessary. 
	 *           If tags are created, contribution creator will be set to this tags as the creator of these tags.
	 *
	 */
	.post(auth.ensureAuthenticated, function(req, res){

		var query = [
			'CREATE (c:contribution {createdBy: {createdByParam}, title: {contributionTitleParam}, body: {contributionBodyParam},' +
			                         'ref: {contributionRefParam}, lastUpdated:{lastUpdatedParam},' +
			                         'dateCreated: {dateCreatedParam}, editted: {edittedParam}}) WITH c',
			'MATCH (u:user) WHERE id(u)={createdByParam}',
			'CREATE (u)-[r:CREATED]->(c) WITH c'
		];

		// This is where the reference link is created, if necessary.
		// if not linked to anything, put -1
		// reference type: REPLYTO, 
		if (parseInt(req.body.ref) !== -1){
			query.push('MATCH (c1:contribution) where id(c1)={contributionRefParam}')
			query.push('CREATE (c)-[r1:' + ( req.body.refType || "RELATED_TO" ) +']->(c1) WITH c')
		}

		// This is where the tag links are created, if necessary.
		// Furthermore, if a tag does not exist yet, create them and set the user as the creator.
		var tagString = 'UNWIND {tagsParam} as tagname '
						+ 'MERGE (t:tag {name : tagname}) '
						+ 'ON CREATE '
						+ 'SET t.createdBy = {createdByParam} '
						+ 'CREATE UNIQUE (c)-[r2:TAGGED]->(t) '

	  	/*
		var tagString = 'FOREACH (tagName in {tagsParam} |'
										+ 'MERGE (t: tag {name: tagName})'
										+ 'ON CREATE SET t.createdBy = {createdByParam}'
										+ 'CREATE UNIQUE (c)-[r2:TAGGED]->(t)'; // link the contribution to this tag
		*/
		query.push(tagString);

		query = query.join('\n');

		var date = Date.now();

		console.log("relationship", req.body.refType);

		var params = {
			createdByParam: parseInt(req.user.id),
			tagsParam: req.body.tags,
			contributionTitleParam: req.body.title,
			contributionBodyParam: req.body.body,
			contributionRefParam: parseInt(req.body.ref), 
			lastUpdatedParam: date,
			dateCreatedParam: date,
			refTypeParam: req.body.refType, 
			edittedParam: false,
		};

		/*
		 *	Only to allow creationg of synthetic data; 
		 *	Changes creating user from actual user to user specified;
		 *	!! Remove in production
		 * 
		 */
		if(auth.ensureSuperAdmin && req.body.author && req.body.createdAt){

			params.createdByParam = parseInt(req.body.author);		// remove in production
			params.dateCreatedParam = new Date(req.body.createdAt).getTime();
			params.lastUpdatedParam = new Date(req.body.createdAt).getTime();
		}

		
		db.query(query, params, function(error, result){
			if (error)
				console.log('Error creating new post for user : ', error);
			else{
				res.send(result[0]);
			}
		}); 

	});

// route: /api/contributions/:contributionId
router.route('/:contributionId')
	// Get a specific contribution details by its id: contribution content, contribution statistics & author information
	.get(auth.ensureAuthenticated, function(req, res){

		var params = {
			contributionIdParam: parseInt(req.params.contributionId)
		}

/*		var query = [
			//'MATCH (c:contribution) WHERE ID(c)= {contributionIdParam}'
			'MATCH (c:contribution) WHERE ID(c)=' + req.params.contributionId,
			'RETURN c'
		];*/

		//query.push('RETURN c');
		var query = [];
		query.push('MATCH (g1:contribution) WHERE id(g1)= {contributionIdParam}')
		query.push('WITH g1')
		query.push('RETURN g1');
		query = query.join('\n');
		console.log(query);


		db.query(query, params, function(error, result){
			if (error)
				console.log('Error fetching contribution of id: ' + req.params.contributionId);
			else{
				console.log(result[0]);
				res.send(result[0]);
			}
		});

	})

	.put(auth.ensureAuthenticated, function(req, res){

		// TODO:
		// check contribution ref and also if this contribution even belongs to current user.
		var query = [
			'MATCH (c:contribution) WHERE ID(c)=' + req.params.contributionId,
			'RETURN c'
		].join('\n');

		var params;

		var oldRef; // previous ref of the contribution

		// Check the current contribution ref
		db.query(query, function(error, result){
			oldRef = result[0].ref;
		});

		if (oldRef !== req.body.ref){
			// If edit reference
			// Pass to relationship routes
			// Case 1: From -1 to something (create the relationship)
			if(oldRef == -1){
				query = [
					'MATCH (c:contribution) WHERE ID(c)={contributionIdParam}',
					'MATCH (c1:contribution) WHERE ID(c1)={contributionRefParam}',
					'CREATE (c)-[r:{refTypeParam}]->(c1)'
				].join('\n');

				params = {
					contributionIdParam: req.params.contributionId,
					contributionRefParam: req.body.ref,
					refTypeParam: req.body.refType
				}

				db.query(query, params, function(error,result){
					if (error)
						res.send('error creating relationship when editting contribution');
				});

			}
			
			// Case 2: From something to -1 (delete the relationship)
			else {
				query = [
					'MATCH (c:contribution) WHERE ID(c)={contributionIdParam}',
					'MATCH (c1:contribution) WHERE ID(c1)={contributionRefParam}',
					'MATCH (c)-[r:{refTypeParam}]->(c1)',
					'DELETE r'
				].join('\n');

				params = {
					contributionIdParam: req.params.contributionId,
					contributionRefParam: req.body.ref,
					refTypeParam: req.body.refType
				}

				db.query(query, params, function(error,result){
					if (error)
						res.send('error creating relationship when editting contribution');
				});


			}

		}

		query = [
			'MATCH (c:contribution) WHERE ID(c)={contributionIdParam}',
			'SET c.title = {contributionTitleParam}',
			'SET c.body = {contributionBodyParam}',
			'SET c.ref = {contributionRefParam',
			'SET c.lastUpdated = {lastUpdatedParam}',
			'SET c.editted = {edittedParam}',
			'SET c.labels = {contributionLabelParam}',
			'SET c.contributionTypes = {contributionTypesParam}'
		].join('\n');

		var params = {
			contributionIdParam: req.params.contributionId,
			contributionTitleParam: req.body.title,
			contributionBodyParam: req.body.body,
			lastUpdatedParam: Date.now(),
			edittedParam: true,
			contributionRefParam: req.body.ref, 
			contributionLabelParam: req.body.labels, //tags
			contributionTypesParam: req.body.contributionTypes
		};

		db.query(query, params, function(req, res){
			if (error)
				res.send('error editting the contribution');
			else
				res.send('success');
		});
	}) 

	.delete(auth.ensureAuthenticated, function(req, res){

		// TODO:
		// check if i own the contribution before deleting it

		var incomingRelsCount = 0;

		var params = {
			contributionIdParam: parseInt(req.params.contributionId),
			userIdParam: parseInt(req.user.id)
		};

		// First count incoming relationships (excluding tagged)
		var countQuery = [
			'MATCH (c:contribution)<-[r]-()',
			'WHERE ID(c)={contributionIdParam} AND NOT (c)<-[r:TAGGED]-(:tag) AND NOT (c)<-[r:CREATED]-(:user)',
			'RETURN {count: count(r)}'
		].join('\n');

		db.query(countQuery, params, function(error, result) {
			if (error)
				console.log('Error in counting the number of incoming relationships of contribution ' + contributionIdParam);
			else{
				incomingRelsCount = result[0].count;

				console.log(incomingRelsCount);

				if (incomingRelsCount === 0) {
					// this is a leaf
					// remove it

					var query = [
						'MATCH (c:contribution) WHERE ID(c)= {contributionIdParam}',
						'MATCH (u:user) WHERE ID(u)={userIdParam}',
						'MATCH (u)-[r:CREATED]->(c)',
						'MATCH (c)-[r1]->()',
						'DELETE r',
						'DELETE r1',
						'DELETE c'
					].join('\n');

					db.query(query, params, function(error, result){
						if (error)
							console.log('Error deleting leaf with contribution id ' + req.params.contributionId + ' for this user. Check if this contribution is created by this user.');
						else
							console.log('success');
					});

					// We need to delete the relationship between contribution and tag, and contribution and user (creator)
					var commonQuery = [
						'MATCH (c:contribution) WHERE ID(c)={contributionIdParam}',
						'MATCH (c)<-[r]-(s) WHERE s:tag OR s:user',
						'DELETE r'
					].join('\n');

					db.query(commonQuery, params, function(error, result){
						if (error)
							console.log('Error deleting the relationship between contribution and tag, and contribution and user');
						else
							res.send('Succeeded deleting relationship between contribution and tag, and contribution and user');
					});
				}
				else
					res.send('Cannot delete non-leaf');

			}
		});
	
	});


router.route('/:contributionId/connections');

router.route('/:contributionId/connections/:connectionId');

function idIndex(a, id){
  for (var i =0; i<a.length; i++)
    if (a[i].id == id) 
      return a[i];
  return null;
};

function setName(n) {
    if (n.labels[0] === "contribution" || n.labels[0]==='post') {
        return n.properties.title;
    } else {
        return n.properties.name;
    }
};


module.exports = router;
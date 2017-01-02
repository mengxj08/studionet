var express = require('express');
var router = express.Router();
var multer = require('multer');
var fs = require('fs-extra');
var auth = require('./auth');
var storage = require('./storage');
var graphQuery = require('./graph-query');
var winston = require('winston');
var db = require('seraph')({
  server: process.env.SERVER_URL || 'http://localhost:7474/', // 'http://studionetdb.design-automation.net'
  user: process.env.DB_USER,
  pass: process.env.DB_PASS
});
var _ = require('underscore');
var contributionUtil = require('./contribution-util');
var contributionsFilterHelper = require('./contributions-filter');


// route: /api/contributions
router.route('/')
  /*
   * Returns all contributions, including the name, created by, created on and id of the contribution if no parmas specified.
   */
  .get(auth.ensureAuthenticated, contributionUtil.handleGetContributionsWithoutParams) 
      

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
	 * Reference link - Reference to another contribution (may be normal contribution or root node)
	 * Tag link - Links itself to the tags specified in the req body, creating them if necessary. 
	 *           If tags are created, contribution creator will be set to this tags as the creator of these tags.
	 *
	 */
	.post(auth.ensureAuthenticated, contributionUtil.initTempFileDest, multer({storage: storage.attachmentStorage}).array('attachments'),  function(req, res, next){

		// Creating the contribution node, then link it to the creator (user)
		var query = [
			'CREATE (c:contribution {createdBy: {createdByParam}, title: {contributionTitleParam},'
			+ ' body: {contributionBodyParam}, ref: {contributionRefParam}, lastUpdated:{lastUpdatedParam},'
			+ ' dateCreated: {dateCreatedParam}, edited: {editedParam}, contentType: {contentTypeParam},'
			+ ' rating: {ratingParam}, totalRating: {totalRatingParam}, rateCount: {rateCountParam}, tags: {tagsParam}, views: {viewsParam}}) WITH c',
			'MATCH (u:user) WHERE id(u)={createdByParam}',
			'CREATE (u)-[r:CREATED]->(c) WITH c',
			'MATCH (c1:contribution) where id(c1)={contributionRefParam}',
			'CREATE (c)-[r1:' + (req.body.refType || "RELATED_TO") +']->(c1) WITH c',
			'UNWIND {tagsParam} as tagName '
						+ 'MERGE (t:tag {name: tagName}) '
						+ 'ON CREATE SET t.createdBy = {createdByParam}'
						+ 'CREATE UNIQUE (c)-[r2:TAGGED]->(t) ',
			'RETURN id(c) as id'
		].join('\n');

		var currentDate = Date.now();
		var params = {
			createdByParam: parseInt(req.user.id),
			tagsParam: req.body.tags,
			contributionTitleParam: req.body.title,
			contributionBodyParam: req.body.body,
			contributionRefParam: parseInt(req.body.ref), 
			lastUpdatedParam: currentDate,
			dateCreatedParam: currentDate,
			refTypeParam: req.body.refType || "RELATED_TO", 
			editedParam: false,
			contentTypeParam: req.body.contentType,
			ratingParam: 0,
			totalRatingParam: 0,
			rateCountParam: 0,
			viewsParam: 0
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
			if (error){
				console.log('[ERROR] Error creating new contribution for user : ', error);
				res.status(500);
				return res.send(error);
			}
			else{
				console.log('[SUCCESS] Success in creating a new contribution for user id: ' + req.user.id);
				req.contributionId = result[0].id;
				res.status(200);
				res.send( result[0] );
				next();
			}
		}); 

	}, contributionUtil.updateDatabaseWithAttachmentsAndGenerateThumbnails);

router.route('/filters')
  .post(contributionUtil.ensureGetContributionsCorrectParams, function(req, res){

    var REQ_DEPTH_KEYWORD = 'd';
    var REQ_GROUPS_KEYWORD = 'g';
    var REQ_RATING_KEYWORD = 'r';
    var REQ_USERS_KEYWORD = 'u';
    var REQ_TIME_KEYWORD = 't';
    var REQ_TAGS_KEYWORD = 'tg';

    // First get all the users matching the specified group, if present
    var groupIds = contributionsFilterHelper.parseArrayOrNumberToInt(JSON.parse(req.body[REQ_GROUPS_KEYWORD]));
    var specifiedUserIds = contributionsFilterHelper.parseArrayOrNumberToInt(JSON.parse(req.body[REQ_USERS_KEYWORD]));    

    var matchAllGroups = contributionsFilterHelper.isMatchingAllForParam(groupIds);
    var matchAllUsers = contributionsFilterHelper.isMatchingAllForParam(specifiedUserIds);

    var usersInGroupsPromise = new Promise(function(resolve, reject){
      if (matchAllGroups || matchAllUsers) {
        return resolve();
      }

      var groupQuery = [ 
        'MATCH (g:group) WHERE ID(g) IN {groupIdParam}',
        'MATCH (u:user)<-[r:MEMBER]-(g)',
        'RETURN collect(distinct id(u))'
      ].join('\n');

      var groupQueryParam = {
        groupIdParam: groupIds
      };

      db.query(groupQuery, groupQueryParam, function(error, result){
        if (error) {
          return reject('[ERROR] Attempt to fetch filtered contributions by /api/contributions failed.\nReason: Failed match for group ids: ' + groupIds);
        }
        return resolve(result[0]);
      });

    });

    usersInGroupsPromise
    .then(function(userIdsFromGroupQuery){
      
      return new Promise(function(resolve, reject){
        var dateArray = contributionsFilterHelper.parseArrayOrNumberToInt(JSON.parse(req.body[REQ_TIME_KEYWORD]));
        var rateArray = contributionsFilterHelper.parseArrayOrNumberToInt(JSON.parse(req.body[REQ_RATING_KEYWORD]));
        var tagsArray = contributionsFilterHelper.parseArrayOrNumberToInt(JSON.parse(req.body[REQ_TAGS_KEYWORD]));

        var userIdsParam = contributionsFilterHelper.getFinalUserIdParam(specifiedUserIds, userIdsFromGroupQuery);
        var dateParamObj = contributionsFilterHelper.getFinalDateParamObj(dateArray);
        var rateParamObj = contributionsFilterHelper.getFinalRateParamObj(rateArray);
        var tagsParamObj = contributionsFilterHelper.getFinalTagsParamObj(tagsArray);

        var queryUserGroupTag = contributionsFilterHelper.getQueryFilteringUsersGroupsAndTags(tagsParamObj, 
            matchAllGroups, matchAllUsers, userIdsParam);
        var queryRating = contributionsFilterHelper.getCombinedQueryFilteringRating(rateParamObj);
        var queryDate = contributionsFilterHelper.getCombinedQueryFilteringDate(dateParamObj);

        var query = [
          queryUserGroupTag,
          queryRating,
          queryDate,
          'RETURN collect(id(c)) as filteredIdList'
        ].join('\n');

        db.query(query, function(error, result){
          if (error)
            return console.log(error);

          return resolve({
            filteredIdList: result[0],
            depthParam: parseInt(req.body[REQ_DEPTH_KEYWORD]),
            queryUserGroupTag: queryUserGroupTag,
            queryRating: queryRating,
            queryDate: queryDate,
          });
        })
      })

    })
    .then(function(result){
      var hash = {};
      result.filteredIdList.forEach(e => hash[e] = true);

      // avg complete query time: 1100ms
      /*
      var query = [
        result.queryUserGroupTag,
        result.queryRating,
        result.queryDate,
        'WITH collect(id(c)) as filteredIdList',
        'OPTIONAL MATCH pathToSuper=(c1)-[*]->(c2:contribution)',
        'WHERE ID(c1) IN filteredIdList',
        'WITH collect(distinct id(c2)) as intermediateNodeList, filteredIdList',
        'OPTIONAL MATCH pathFromChildren=(c3)<-[*1..' + result.depthParam + ']-(c4:contribution)',
        'WHERE ID(c3) IN filteredIdList',
        'WITH filteredIdList + intermediateNodeList + collect(distinct id(c4)) as combinedList',
        'UNWIND combinedList as unwindedCombinedList',
        'WITH collect(distinct unwindedCombinedList) as distinctUnwindedCombinedList',
        'MATCH p=(source)-[*1]->(target) WHERE ID(source) IN distinctUnwindedCombinedList AND ID(target) IN distinctUnwindedCombinedList',
        'RETURN p'
      ].join('\n');*/

      // avg complete query time: 800ms
      /*
      var query = [
        result.queryUserGroupTag,
        result.queryRating,
        result.queryDate,
        'WITH c, collect(id(c)) as filteredIdList',
        'OPTIONAL MATCH pathToSuper=(c)-[*]->(c2:contribution)',
        'WITH c, collect(distinct id(c2)) as intermediateNodeList, filteredIdList',
        'OPTIONAL MATCH pathFromChildren=(c)<-[*1..' + result.depthParam + ']-(c4:contribution)',
        'WITH filteredIdList + intermediateNodeList + collect(distinct id(c4)) as combinedList',
        'UNWIND combinedList as unwindedCombinedList',
        'WITH collect(distinct unwindedCombinedList) as distinctUnwindedCombinedList',
        'MATCH p=(source)-[*1]->(target) WHERE ID(source) IN distinctUnwindedCombinedList AND ID(target) IN distinctUnwindedCombinedList',
        'RETURN p'
      ].join('\n');
      */

      // avg complete query time: 700ms
      var query = [
        result.queryUserGroupTag,
        result.queryRating,
        result.queryDate,
        'WITH c, collect(c) as filteredNodeList',
        'OPTIONAL MATCH pathToSuper=(c)-[*]->(contributionOnPathToSuper:contribution)',
        'WITH c, collect(distinct contributionOnPathToSuper) as intermediateNodeList, filteredNodeList',
        'OPTIONAL MATCH pathFromChildren=(c)<-[*1..' + result.depthParam + ']-(children:contribution)',
        'WITH filteredNodeList + intermediateNodeList + collect(distinct children) as combinedList',
        'UNWIND combinedList as unwindedCombinedList',
        'WITH collect(distinct unwindedCombinedList) as distinctUnwindedCombinedList',
        'UNWIND distinctUnwindedCombinedList as source',
        'MATCH p=(source)-[]->(target:contribution) WHERE target IN distinctUnwindedCombinedList',
        'RETURN p'
      ].join('\n');

      graphQuery(query, function(data) {    

        data['nodes'].map((node) => {
          node.match = hash[node['id']];
          return node;
        });

        console.log('[SUCCESS] Sucess in fetching filtered contributions in /api/contributions.')
        return res.send(data);

      });
    })
    .catch(function(reason){
      console.log(reason);
      return res.send(reason);
    });

  });

// route: /api/contributions/:contributionId
router.route('/:contributionId')
  // Get a specific contribution details by its id: contribution content, contribution statistics & author information
  .get(auth.ensureAuthenticated, function(req, res){

    var query = [
      'MATCH (c:contribution) WHERE ID(c)={contributionIdParam}',
      'OPTIONAL MATCH (c)<-[rating5:RATED {rating: 5}]-(:user) ',
      'OPTIONAL MATCH (c)<-[rating4:RATED {rating: 4}]-(:user) ',
      'OPTIONAL MATCH (c)<-[rating3:RATED {rating: 3}]-(:user) ',
      'OPTIONAL MATCH (c)<-[rating2:RATED {rating: 2}]-(:user) ',
      'OPTIONAL MATCH (c)<-[rating1:RATED {rating: 1}]-(:user) ',
      'OPTIONAL MATCH (c)<-[rating0:RATED {rating: 0}]-(:user)',
      'OPTIONAL MATCH (a:attachment)<-[:ATTACHMENT]-(c)',
      'RETURN { \
                ratingArray: [count(rating0), \
                  count(rating1), count(rating2), \
                  count(rating3), count(rating4), \
                  count(rating5)], \
                id: ID(c),\
                edited: c.edited, \
                rating: c.rating, \
                totalRating: c.totalRating, \
                title: c.title, \
                body: c.body, \
                tags: c.tags, \
                lastUpdated: c.lastUpdated, \
                ref: c.ref, \
                dateCreated: c.dateCreated, \
                rateCount: c.rateCount, \
                createdBy: c.createdBy, \
                contentType: c.contentType, \
                views: c.views, \
                attachments: collect({ \
                  attachment: a, \
                  id: id(a) \
                }) \
              }'
    ].join('\n');

    var params = {
      contributionIdParam: parseInt(req.params.contributionId)
    };

    db.query(query, params, function(error, result){
      if (error)
        console.log('[ERROR] Error fetching contribution of id: ' + req.params.contributionId);
      else{
        console.log('[SUCCESS] Success in getting the contribution details for contribution id: ' + req.params.contributionId);
        res.send(result[0]);
      }
    });

  })

  .put(auth.ensureAuthenticated, function(req, res){
    console.log(req.body);

    var query = [
      'MATCH (c:contribution) WHERE ID(c)=' + req.params.contributionId,
      'RETURN c'
    ].join('\n');

    var params;
    var oldRef; // previous ref of the contribution

    // Check the current contribution ref
    var contributionPromise =  new Promise(function(resolve, reject){
      db.query(query, function(error, result){
        if (error){
          return reject();
        }
        else {
          return resolve(result[0]);
        }
      });
    });

    contributionPromise
    .then(function(result){
      var oldRef = result.ref;
      var newRef = req.body.ref;

      var oldTags = result.tags;
      var newTags = req.body.tags || [];

      var createdBy = result.createdBy;
      var changeRelationQuery = [];
      var changeTagsQuery = [];
      var tagsAddQuery = [];
      var tagsRemoveQuery = [];

      if (createdBy !== parseInt(req.user.id)) {
        return res.send('Cannot edit contribution that was not created by you');
      }

      editContributionDetailsQuery = [
        'MATCH (c3:contribution) WHERE ID(c3)={contributionIdParam}',
        'SET c3.title = {contributionTitleParam}',
        'SET c3.body = {contributionBodyParam}',
        'SET c3.tags = {tagsParam}',
        'SET c3.ref = {contributionRefParam}',
        'SET c3.lastUpdated = {lastUpdatedParam}',
        'SET c3.edited = {editedParam}',
        'SET c3.contentType = {contentTypeParam}',
      ];

      if (!(oldTags instanceof Array)) {
        oldTags = [oldTags];
      }

      if (!(newTags instanceof Array)) {
        newTags = [newTags];
      }

      var tagsToRemove = _.difference(oldTags, newTags);
      var tagsToAdd = _.difference(newTags, oldTags);

      // remove old tags
      if (tagsToRemove.length > 0) {
        tagsRemoveQuery = [
          'WITH c3',
          'UNWIND {tagsToRemoveParam} as tagToRemove',
          'OPTIONAL MATCH (c3)-[r1:TAGGED]->(t1:tag {name: tagToRemove})',
          'DELETE r1',
          'WITH c3,t1',
          'OPTIONAL MATCH (t1)<-[r2:TAGGED]-()',
          'WITH c3, t1, CASE WHEN count(r2)>0 THEN [] ELSE [1] END as array',
          'FOREACH (x in array | DELETE t1)',
        ];
      }

      // add new tags
      if (tagsToAdd.length > 0) {
        tagsAddQuery = [
          'WITH c3',
          'UNWIND {tagsToAddParam} as tagToAdd',
          'MERGE (t2:tag {name: tagToAdd})',
          'ON CREATE SET t2.createdBy = {createdByParam}',
          'CREATE UNIQUE (c3)-[:TAGGED]->(t2)'
        ];
      }

      var query = changeRelationQuery.concat(editContributionDetailsQuery, tagsRemoveQuery, tagsAddQuery).join('\n');

      var params = {
        tagsToRemoveParam: tagsToRemove,
        tagsToAddParam: tagsToAdd,
        contributionIdParam: parseInt(req.params.contributionId),
        tagsParam: newTags,
        contributionTitleParam: req.body.title,
        contributionBodyParam: req.body.body,
        contributionRefParam: parseInt(req.body.ref), 
        lastUpdatedParam: Date.now(),
        //refTypeParam: req.body.refType,
        editedParam: true,
        createdByParam: req.user.id,
        contentTypeParam: req.body.contentType,
      };

      db.query(query, params, function(error, result){
        if (error){
          console.log(error);
          res.status(500);
          res.send('[ERROR] Cannot edit the given contribution with id: ' + req.params.contributionId);
        }
        else{
          res.status(200);
          res.send(result[0]);
          console.log('[SUCCESS] Success in editing the contribution with id: ' + req.params.contributionId);
        }
      });

    });
  }) 

  .delete(auth.ensureAuthenticated, function(req, res){

    var incomingRelsCount = 0;

    var params = {
      contributionIdParam: parseInt(req.params.contributionId),
    };

    // First count incoming relationships 
    var countQuery = [
      'MATCH (c:contribution)',
      'WHERE ID(c)={contributionIdParam}',
      'OPTIONAL MATCH (c)<-[r]-(:contribution)',
      'RETURN {count: count(r), createdBy: c.createdBy}'
    ].join('\n');

    var countPromise = new Promise(function(resolve, reject){
      db.query(countQuery, params, function(error, result){

        if (error){
          console.log('[ERROR] Error in counting the number of incoming relationships of contribution ' + contributionIdParam);
          res.send('Error counting number of incoming relationships of contribution ' + contributionIdParam);
          reject(error);
        }
        else {
          resolve(result[0]);
        }

      });
    });

    countPromise
    .then(function(result){

      return new Promise(function(resolve, reject){
        var incomingRelsCount = result.count;
        var isCreator = result.createdBy === req.user.id;

        if (!isCreator){
          return res.send('Cannot delete contribution that was not created by you');
        }

        deleteAttachmentsFromFileAndDbAsync(parseInt(req.params.contributionId));
        if (incomingRelsCount > 0) {
          var query = [
            'MATCH (c:contribution) WHERE ID(c)={contributionIdParam}',
            'SET c.edited = {editedParam},',
            'c.lastUpdated = {lastUpdatedParam},',
            'c.title = {titleParam},',
            'c.body = {bodyParam}',
          ].join('\n');

          var params = {
            contributionIdParam: parseInt(req.params.contributionId),
            editedParam: true,
            lastUpdatedParam: Date.now(),
            titleParam: 'DELETED',
            bodyParam: 'CONTRIBUTION DELETED'
          };

          db.query(query, params, function(error, result){
            if (error)
              console.log(error);
          })
          return res.send('Deleted non-leaf node attachments and marked contribution as deleted');
        }
        resolve();
      })

    })
    .then(function(result){
      var query = [
        'MATCH (c:contribution) WHERE ID(c)={contributionIdParam}',
        'OPTIONAL MATCH (c)-[r:TAGGED]->(t:tag)',
        'DETACH DELETE c',
        'WITH t',
        'OPTIONAL MATCH (t)<-[r1:TAGGED]-()',
        'WITH t, CASE WHEN count(r1)>0 THEN [] ELSE [1] END as array',
        'FOREACH (x in array | DETACH DELETE t)'
      ].join('\n');

      db.query(query, params, function(error, result){
        if (error) {
          console.log('[ERROR] Error deleting leaf with contribution id ' + req.params.contributionId + ' for this user.');
          res.send('Cannot delete this leaf');
        }
        else {
          res.send('Successfully deleted contribution with id: ' + req.params.contributionId);
        }
      })
    });

  });

var deleteAttachmentsFromFileAndDbAsync = function(contributionId) {
  // delete from db
  var query = [
    'OPTIONAL MATCH (c:contribution)-[:ATTACHMENT]->(a:attachment) WHERE ID(c)={contributionIdParam}',
    'DETACH DELETE a'
  ].join('\n');

  var params = {
    contributionIdParam: contributionId
  };

  db.query(query, params, function(error, result){
    if (error)
      console.log(error);
  });

  var attachmentsPath = './uploads/contributions/' + contributionId; 
  fs.remove(attachmentsPath, function(err){
    if (err) {
      return console.log(err);
    }
  });
}

// route: /api/contributions/:contributionId/view
router.route('/:contributionId/view')
  .post(auth.ensureAuthenticated, function(req, res){
    var query = [
      'MATCH (c:contribution) WHERE ID(c)={contributionIdParam}',
      'MATCH (u:user) WHERE ID(u)={userIdParam}',
      'MERGE p=(u)-[r:VIEWED]->(c)',
      'ON CREATE SET r.views = 1',
      'ON MATCH SET r.views = r.views + 1',
      'SET c.views = c.views + 1, r.lastViewed={lastViewedParam}',
      'RETURN p'
    ].join('\n');

    var params = {
      contributionIdParam: parseInt(req.params.contributionId),
      userIdParam: req.user.id,
      lastViewedParam: Date.now()
    };

    db.query(query, params, function(error, result){
      if (error){
        console.log(error);
      }
      else{
        res.send('Successfully viewed contribution id: ' + req.params.contributionId);
      }
    });
  });

// route: /api/contributions/:contributionId/rate
router.route('/:contributionId/rate')
  .post(auth.ensureAuthenticated, function(req, res) {
    var givenRating = parseInt(req.body.rating);

    if (givenRating < 0 || givenRating > 5) {
      return res.send('Please give a rating between 0 and 5 inclusive');
    }

    var query = [
      'MATCH (c:contribution) WHERE ID(c)={contributionIdParam}',
      'MATCH (u:user) WHERE ID(u)={userIdParam}',
      'MERGE p=(u)-[r:RATED]->(c)',
      'ON CREATE SET c.rating = (c.totalRating + {ratingParam})/toFloat(c.rateCount+1), c.rateCount = c.rateCount+1, c.totalRating = c.totalRating + {ratingParam}',
      'ON MATCH SET c.rating = (c.totalRating - r.rating + {ratingParam})/toFloat(c.rateCount), c.totalRating = c.totalRating - r.rating + {ratingParam}',
      'SET r.rating={ratingParam}, r.lastRated={lastRatedParam}',
      'RETURN p'
    ].join('\n');

    var params = {
      userIdParam: req.user.id,
      contributionIdParam: parseInt(req.params.contributionId),
      ratingParam: givenRating,
      lastRatedParam: Date.now()
    };

    db.query(query, params, function(error,result){
      if (error) {
        console.log(error);
      }
      else {
        console.log('[SUCCESS] Successfully rated contribution id ' + req.params.contributionId + ' with the rating ' + req.body.rating);
        res.send('Successfully rated contribution id ' + req.params.contributionId + ' with the rating ' + req.body.rating);
      }
    })
  });


//route: /api/contributions/:contributionId/attachments
router.route('/:contributionId/attachments')
  .post(auth.ensureAuthenticated, contributionUtil.ensureUserOwnsContribution, contributionUtil.initTempFileDest, 
  multer({storage: storage.attachmentStorage}).array('attachments'), 
  contributionUtil.updateDatabaseWithAttachmentsAndGenerateThumbnails);

//route: /api/contributions/:contributionId/attachments/:attachmentId
router.route('/:contributionId/attachments/:attachmentId')
  .get(auth.ensureAuthenticated, contributionUtil.getHandlerToSendImage(false))

  .delete(auth.ensureAuthenticated, function(req, res, next){
    // ensure user owns the contribution id first
    // also check the attachment id
    var query = [
      'MATCH (c:contribution) WHERE ID(c)={contributionIdParam}',
      'WITH c',
      'MATCH (c)-[:ATTACHMENT]->(a:attachment) WHERE ID(a)={attachmentIdParam}',
      'RETURN {contributionCreatorId: c.createdBy, isValidAttachment: count(a), fileName: a.name}'
    ].join('\n');

    var params = {
      contributionIdParam: parseInt(req.params.contributionId),
      attachmentIdParam: parseInt(req.params.attachmentId)
    };

    db.query(query, params, function(error, result){
      if (error){
        console.log(error);
        return res.send('error');
      }
      if (result.length === 0) {
        return res.send('error');
      }

      var contributionCreatorId = result[0].contributionCreatorId;
      var isValidAttachment = result[0].isValidAttachment === 1;
      var userId = parseInt(req.user.id);

      if (userId === contributionCreatorId && isValidAttachment) {
        req.fileNameToDelete = result[0].fileName;
        next();
      } else {
        return res.send('not the owner');
      }
    });
  }, function(req, res){
    // user is the creator.
    // delete the attachment file + thumbnail (if present) and node in db
    
    var attachmentPath = './uploads/contributions/' + req.params.contributionId + '/attachments/' + req.fileNameToDelete;
    var thumbnailPath = './uploads/contributions/' + req.params.contributionId + '/attachments/thumbnails/' + req.fileNameToDelete;

    fs.remove(attachmentPath, function(err){
      if (err) {
        return console.error(err);
      }
      fs.remove(thumbnailPath, function(err){
        if (err){
          return console.error(err);
        }
      });
    });

    var query = [
      'MATCH (a:attachment) WHERE ID(a)={attachmentIdParam}',
      'DETACH DELETE a'
    ].join('\n');

    var params = {
      attachmentIdParam: parseInt(req.params.attachmentId)
    };

    db.query(query, params, function(error, result){
      if (error) {
        console.log(error);
        res.status(500);
        res.send('error');
      } else {
        res.status(200);
        res.send('success');
      }
    })
    /*

    var query = [
      'MATCH (a:attachment)<-[r:ATTACHMENT]-(c:contribution)',
      'WHERE ID(a)={attachmentIdParam} AND ID(c)={contributionIdParam}',
      'CREATE (a)<-[:DELETED_ATTACHMENT]-(c)',
      'DELETE r'
    ].join('\n');

    var params = {
      attachmentIdParam: parseInt(req.params.attachmentId),
      contributionIdParam: parseInt(req.params.contributionId)
    };

    db.query(query, params, function(error, result){
      if (error) {
        console.log(error);
        res.status(500);
        res.send('error');
      } else {
        res.status(200);
        res.send('success');
      }
    });*/

  });

//route: /api/contributions/:contributionId/attachments/:attachmentId
router.route('/:contributionId/attachments/:attachmentId/thumbnail')
  .get(auth.ensureAuthenticated, contributionUtil.getHandlerToSendImage(true))

module.exports = router;
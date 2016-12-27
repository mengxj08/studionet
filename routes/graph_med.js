var express = require('express');
var router = express.Router();
var auth = require('./auth');
var graphQuery = require('./graph-query');
var db = require('seraph')({
  server: process.env.SERVER_URL || 'http://localhost:7474/', // 'http://studionetdb.design-automation.net'
  user: process.env.DB_USER,
  pass: process.env.DB_PASS
});

// route: /graph/med
router.route('/')
  .get(auth.ensureAuthenticated, function(req, res){

    var dist = 2;   // default path distance up to 2

    // check for query param (distance)
    if (req.query.distance)
      dist = req.query.distance;

    var query = [
                  'MATCH (u:user) WHERE ID(u)=' + req.user.id,
                  'MATCH p=(u)-[*1..' + dist +']-()',
                  'RETURN p'
    ].join('\n');

    console.log(query);

    graphQuery(query, function(data){
      res.send(data);
    });

  });

module.exports = router;

var express = require('express');
var router = express.Router();
var auth = require('./auth');
var apiCall = require('./apicall');
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

    apiCall(query, function(data){
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

  });

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

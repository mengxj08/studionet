var request = require('request');
var inspect = require('eyespect').inspector();
var db_loc = 'http://'+ process.env.DB_USER +':'+ process.env.DB_PASS +'@localhost:7474/db/data/transaction/commit'; 
if(process.env.SERVER_URL != undefined)
    db_loc = 'http://'+ process.env.DB_USER +':'+ process.env.DB_PASS +'@' + process.env.SERVER_URL.slice(7) + '/db/data/transaction/commit'; 

var idIndex = function (a, id){
  for (var i = 0; i < a.length ; i++) {
    if (a[i].id === id) {
      return a[i];
    }
  }
  return null;
}

var graphQuery = function (query, callback){
  var postData = {
    "statements": [
      {
        "statement": query,
        "resultDataContents": [
          "graph", "row"
        ],
        "includeStats": true
      }
    ]
  };

  var options = {
    method: 'post',
    body: postData,
    json: true,
    url: db_loc
  };

  request(options, function (err, result, body) { 

    if (err) {
      inspect(err, 'error posting json');
      return;
    }
    
    var headers = result.headers;
    var statusCode = result.statusCode;
    var nodes = [], links = [];

    var data = body.results[0].data;
      
    data.forEach(function(row){
      // for each graph

      row.graph.nodes.forEach(function(n) {
        if (idIndex(nodes, n.id) == null)
            nodes.push({
                onSpiral: -1,                     // for graph
                id: n.id,                         // for graph
                type: n.properties.contentType,   // for graph
                ref: n.properties.ref,            // for replies
                title: n.properties.title,                // for qtip 
                createdBy: n.properties.createdBy,                // for qtip
                rating: n.properties.rating,      // for board + coloring
                rateCount: n.properties.rateCount,  // for board
                dateCreated: n.properties.dateCreated,  // for board
                totalRatings: n.properties.totalRating, // for board
                views: n.properties.views     // for board
            }); 
      });

      links = links.concat(row.graph.relationships.map(function(r) {
          return {
              source: idIndex(nodes, r.startNode).id,   // should not be a case where start or end is null.
              target: idIndex(nodes, r.endNode).id,
              name: r.type,
              properties: r.properties
          };
      }));

    });


    
    callback({
      nodes: nodes, 
      links: links
    }); 

  });

}

module.exports = graphQuery;




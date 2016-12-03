var request = require('request');
var inspect = require('eyespect').inspector();

var db_loc = 'http://'+ process.env.DB_USER +':'+ process.env.DB_PASS +'@localhost:7474/db/data/transaction/commit'; 
if(process.env.SERVER_URL != undefined)
    db_loc = 'http://'+ process.env.DB_USER +':'+ process.env.DB_PASS +'@' + process.env.SERVER_URL.slice(7) + '/db/data/transaction/commit'; 


function apiCall(query, callback){
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
          inspect(err, 'error posting json')
          return
        }
        var headers = result.headers
        var statusCode = result.statusCode
        inspect(headers, 'headers')
        inspect(statusCode, 'statusCode')
        inspect(body, 'body')
        callback(body.results[0].data);
      });
};


module.exports = apiCall;
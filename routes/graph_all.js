var express = require('express');
var router = express.Router();
var auth = require('./auth');
var apiCall = require('./apicall');
var db = require('seraph')({
	server: process.env.SERVER_URL || 'http://localhost:7474/', // 'http://studionetdb.design-automation.net'
	user: process.env.DB_USER,
	pass: process.env.DB_PASS
});

// route: /graph/all
router.route('/')

	// return whole graph
	.get(auth.ensureAuthenticated, function(req, res){

		// AKM - needs a direction or it sends double
		var query = [
									//'MATCH p=()-[]->() RETURN p'
									'MATCH (p:contribution)-[r]->(q:contribution) RETURN p,r'
								].join('\n');

		apiCall(query, function(data){
			var nodes = [], links = [];
			
			data.forEach(function(row){
				// for each graph

				row.graph.nodes.forEach(function(n) {
	        if (idIndex(nodes, n.id) == null)
	            nodes.push({
	                id: n.id,
	                name: setName(n),  // edit: AKM
	                type: n.labels[0]
	            });
    		});
		    links = links.concat(row.graph.relationships.map(function(r) {
		        return {
		            source: r.endNode,//idIndex(nodes, r.startNode).id,	// should not be a case where start or end is null. // inverted source and target - to be discussed further <!>
		            target: r.startNode,//idIndex(nodes, r.endNode).id,
		            type: r.type
		        };
		    }));
			});

			res.send({nodes: nodes, links: links});

		});

  });


// route: /graph/all/me
router.route('/me')

	// return only my network
	.get(auth.ensureAuthenticated, function(req, res){
		
		/*
		var query = [
									'MATCH (u:user) WHERE ID(u)=87',
									'MATCH (u)-[*1..2]-(a)',
									'RETURN u as user, collect(a) as things'
								].join('\n');
		*/

		var query = [
									'MATCH (u:user) WHERE ID(u)=' + req.user.id,
									'MATCH p=(u)-[*1..2]-()',
									'RETURN p'
								].join('\n');


		
		apiCall(query, function(data){
			var nodes = [], links = [];
			
			data.forEach(function(row){
				// for each graph

				row.graph.nodes.forEach(function(n) {
	        if (idIndex(nodes, n.id) == null)
	            nodes.push({
	                id: n.id,
	                type: n.labels[0],
	                name: setName(n)
	            });
    		});
		    links = links.concat(row.graph.relationships.map(function(r) {
		        return {
		            source: idIndex(nodes, r.startNode).id, 	// should not be a case where start or end is null.
		            target: idIndex(nodes, r.endNode).id//,
		            //type: r
		        };
		    }));
			});

			res.send({nodes: nodes, links: links});

		});
		

		/*
		db.query(query, function(error, result){
			if (error)
				console.log('Error for /api/all');
			else{
				res.send(result);

				var nodes = [], links = [];

				// transform data into d3 friendly json
				
				var i = 0;
				result.forEach(function(curr){
					user = curr[0];
					things = curr[1];

					nodes.append({openId: user.nusOpenId, name: user.name, label: "user"});
					
				})
				

				
			}
		});
		*/

	});

	// route: /graph/users
	router.route('/users')

		// return whole graph
		.get(auth.ensureAuthenticated, function(req, res){

			// AKM - needs a direction or it sends double
			var query = [
							'MATCH (a:user)-[r*0..2]-(b:user)',
							'WHERE NOT ID(a) =ID(b)',
							'RETURN a.name, b.name, COUNT(r)'
						].join('\n');
		
			apiCall(query, function(data){	

				var rows = [];
				
				data.forEach(function(row){

					rows.push(row.row);

					
				});

				res.send(rows);

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
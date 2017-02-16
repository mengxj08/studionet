// ---------------- Graph Functionality 
angular.module('studionet')

.factory('GraphService', ['$http', 'supernode', 'profile', 'tags', function($http, supernode, profile, tags){


	var opts = {
	  lines: 13 // The number of lines to draw
	, length: 28 // The length of each line
	, width: 2 // The line thickness
	, radius: 60 // The radius of the inner circle
	, scale: 1 // Scales overall size of the spinner
	, corners: 1 // Corner roundness (0..1)
	, color: '#B9B9B9' // #rgb or #rrggbb or array of colors
	, opacity: 0.25 // Opacity of the lines
	, rotate: 0 // The rotation offset
	, direction: 1 // 1: clockwise, -1: counterclockwise
	, speed: 1 // Rounds per second
	, trail: 60 // Afterglow percentage
	, fps: 20 // Frames per second when using setTimeout() as a fallback for CSS
	, zIndex: 2e9 // The z-index (defaults to 2000000000)
	, className: 'spinner' // The CSS class to assign to the spinner
	, top: '50%' // Top position relative to parent
	, left: '50%' // Left position relative to parent
	, shadow: false // Whether to render a shadow
	, hwaccel: false // Whether to use hardware acceleration
	, position: 'absolute' // Element positioning
	}

	
	var o = {
		activeNode: undefined,
		graph : undefined,
		threshold: 0,
		comments: undefined,
		spinner : new Spinner(opts) // refactor
	};




	// --------- Obeservers
	var observerCallbacks = [];

	// register an observer
	o.registerObserverCallback = function(callback){
	   observerCallbacks.push(callback);
	};

	// call this when you know graph has been changed
	var notifyObservers = function(){
		angular.forEach(observerCallbacks, function(callback){
	    	 callback();
	    });
	};


	//------ Gets the graph from the URL and creates the graph
	var lastTapped = 0;
	o.getGraph = function( container, graphObject ){
		
		o.spinner.spin(document.getElementById('cy'));

		var graph_url  = '/graph/all';

	
		return $http.get(graph_url).success(function(data){

			// make graph with the data - could provide a container id
			o.graph = STUDIONET.GRAPH.makeGraph( data, container ); // defaults to cy

			o.threshold = graphObject.threshold;
			o.comments = o.graph.nodes("[type='comment']").remove();

			// add interactions back to the graph
			o.graph.off("tap");
      		o.graph.off("mouseover");

			// Add graph interactions
			o.graph.on('mouseover', 'node', function(evt){
			  	graphObject.onMouseOver(evt);
			});

			o.graph.on('tap', function(evt){

				var dblClick = false;
				var tapped = (new Date()).getTime();
				if(tapped - lastTapped < 500)
					dblClick = true;
				lastTapped = tapped;

				if( evt.cyTarget.isEdge && evt.cyTarget.isEdge() )
				    graphObject.onEdgeSingleClick(evt);
				else if( !( (evt.cyTarget.isNode && evt.cyTarget.isNode()) ) ){
				    graphObject.onCanvasClick(evt)
				}
				else if( evt.cyTarget.isNode /*&& evt.cyTarget.id() == o.activeNode*/ ){
					if(dblClick)
				    	graphObject.onNodeDoubleClick(evt);
				    else
				    	graphObject.onNodeSingleClick(evt);
				    	
				}
				else
				  console.warn("Undefined Interaction");
			});

			o.graph.reset();
			repositionNodes();


			// notify any controller watching the graph
			notifyObservers();

		});
	};


	var repositionNodes = function(node){

		// remove the supernode
		o.graph.getElementById(supernode.contribution).remove();

		// remove the comments
		o.comments = o.comments.add( o.graph.nodes("[type='comment']").remove() );

  		// redraw graph
  		if(node != undefined && node.type == "comment"){
  			o.spinner.stop();
  			return; 
  		}
  		else{
  			o.graph.reset();
  			o.spinner.spin(document.getElementById('cy'));
			o.graph.nodes().map(function(node){
				node.data('onSpiral', -1);
			})
			o.draw_graph();
  		}
	}

	flattenGraph = function(cy){
		var graph = {};
		graph.nodes = cy.nodes().map(function(node){
			return { 	
						id: node.id(),
						onSpiral: -1, 
						incomers: node.incomers().nodes().map(function(n){
							return n.id();
						}),
						predecessors: node.predecessors().nodes().map(function(n){
							return n.id();
						}),
						position: node.position()
					}
		})

		return JSON.stringify(graph);
	}

	o.draw_graph = function(node){
		if (window.Worker) {

  			console.log("Worker exists");
			var myWorker = new Worker('/user/components/graphs/graph-worker.js');
			myWorker.postMessage([ flattenGraph(o.graph), o.threshold, supernode.contribution, window.innerWidth, window.innerHeight]);
	  		console.log('Message posted to worker');

	  		myWorker.onmessage = function(e) {
			  console.log("graph positions received");
			  
			  var graphPos = JSON.parse(e.data);
			  o.spinner.stop();
			  graphPos.nodes.map(function(n){

			  	var node = o.graph.getElementById(n.id);

			  	if(node.position().x == n.position.x && node.position().y == n.position.y){
			  		// do nothing
			  	}
			  	else
			  		var time = 4000;
			  		if(n.onSpiral == n.id){
			  			console.log("on spiral")
			  			time = 800;
			  		}
			        node.animate(
			            { 
			              position : { x: n.position.x, y: n.position.y } 
			            }, 
			            { 
			              duration: time, 
			            }
			        );

			  });

			}
		}
		else{
			STUDIONET.GRAPH.draw_graph(o.graph, o.threshold, supernode.contribution, o.spinner, window.innerWidth, window.innerHeight);
		}

	}

	//------ Graph Manipulations
	o.getNode = function(node){

		var id = undefined;
		if( node instanceof Object ){
			if(node.id instanceof Function)
				id = node.id();
			else
				id = node.id;
		}
		else
			id = node;

		var node = o.graph.getElementById(id).length ? o.graph.getElementById(id) :  o.comments.getElementById(id);

		if(node.data('db_data') == undefined){
			
			$http.get('/api/contributions/' + id).success(function(res){

				var data = tagCorrectionFn(res)
				for(prop in data){
					if(data.hasOwnProperty(prop)){
						node.data(prop, data[prop]);
					}

				}
			
				node.data( 'db_data',  true );
				//console.log("Fetched data", id);
			
			});
		
		}
		else{
			// do something
			// console.log("data already defined", id);
		}

	}

	// ---- Create a contribution
	// Data needs to be sent in FormData format
	o.createNode = function(new_contribution){

		o.spinner.spin(document.getElementById('cy'));

		var formData = new FormData();
		formData.append('title', new_contribution.title);
		formData.append('body', new_contribution.body);
		formData.append('tags', new_contribution.tags);
		formData.append('refType', new_contribution.refType);
		formData.append('contentType', new_contribution.contentType);
		formData.append('ref', new_contribution.ref);

		new_contribution.attachments.map(function(file){	formData.append('attachments', file, file.name); 	})
	    return $http({
				method  : 'POST',
				url     : '/api/contributions',
				headers : { 'Content-Type': undefined, 'enctype':'multipart/form-data; charset=utf-8' },
				processData: false,
				data: formData
	    })
	    .success(function(res) {
	    	o.selectNode(res.id);
	    })
	    .error(function(error){
	    	o.spinner.stop();
			throw error;
	    }) 
	}


	// ---- Updates a contribution
	// Data needs to be sent in FormData format 
	// Fix me!
	o.updateNode = function(update_contribution){

		var formData = new FormData();
		formData.append('title', update_contribution.title);
		formData.append('body', update_contribution.body);
		formData.append('tags', update_contribution.tags);
		formData.append('contentType', update_contribution.contentType);
		formData.append('ref', update_contribution.ref);

		update_contribution.attachments.map(function(file){
			formData.append('attachments', file, file.name);
		})

		return $http({
			  method  : 'PUT',
			  url     : '/api/contributions/'+ update_contribution.id,
			  headers : { 'Content-Type': undefined, 'enctype':'multipart/form-data; charset=utf-8' },
      	      processData: false,
              data: formData
			 })
			.then(function(res) {

				o.selectNode(update_contribution.id);



				// send success
				return res;  
			})	
	}

	// ---- Deletes a contribution
	// Confirmation Testing happens here
	o.deleteNode = function(contribution_id){

		var r = confirm("Are you sure you want to delete your node? This action cannot be undone.");
        if (r == true) {

        	o.spinner.spin(document.getElementById('cy'));

        	o.removeAdditionalStyles();

	        return $http({
					method  : 'delete',
					url     : '/api/contributions/' + contribution_id,
					data    : {},  // pass in data as strings
					headers : { 'Content-Type': 'application/json' }  // set the headers so angular passing info as form data (not request payload)
					})
		    .success(function(res) {

				// remove node from graph
				o.removeNode(contribution_id);

				// refresh tags
				tags.getAll();
				
				// refresh profile
				profile.getUser();


		    })
		    .error(function(error){
		    	o.spinner.stop();
				throw error;
		    })	
		}
		else
			console.log("Error Deleting");
	}


	o.addNewNode = function(node){
		o.graph.add({group: "nodes",	 	data: node, 	position: { x: window.innerWidth/2, y : window.innerHeight/2 }});
		
		if(node.ref != supernode.contribution)
			o.graph.add({group: "edges", 		data: { source: node.id, target: node.ref, properties: {} } });
		
		repositionNodes(node);
	}

	o.updateNodeInGraph = function(id){

		var node = o.graph.getElementById(id).length ? o.graph.getElementById(id) :  o.comments.getElementById(id);

		$http.get('/api/contributions/' + id).success(function(res){

			var data = tagCorrectionFn(res)
			for(prop in data){
				if(data.hasOwnProperty(prop)){
					node.data(prop, data[prop]);
				}

			}
		
			node.data( 'db_data',  true );
			//console.log("Fetched data", id);
		
		});

		// refresh tags
		tags.getAll();
		
		// refresh profile
		profile.getUser();
	}


	o.removeNode = function(node_id){

		var result = o.graph.getElementById(node_id).length ? function(){ 
																o.graph.getElementById(node_id).remove(); 
																repositionNodes();
															  }(): 
															  function(){ 
																	o.comments = o.comments.filter(function(id, com){
																			if(com.id() == node_id){
																				return false;
																			}
																			else
																				return true;
																	})
																	o.spinner.stop();
																}();
	};

	// ---- Updates view count of a contribution in the ContributionsHash
	o.updateViewCount = function(id){
		return $http.post('/api/contributions/' + id + '/view').success(function(data){
			o.graph.getElementById(id).views++;
		});
	};

	o.rateNode = function(id, rating){
		return $http.post('/api/contributions/' + id + '/rate', {'rating': rating} ).success(function(data){
			profile.getActivity();
		});
	};



	// ----------- Styling Options
	o.removeAdditionalStyles = function(){
	  	o.graph.batch(function(){

	      o.graph.elements()
	        .removeClass('highlighted')
	        .removeClass('selected')
	        .removeClass('faded');
	  	});          

	  	o.activeNode = {};
	};

	o.selectNode = function( node ){

		// node is either a cytoscape node or an id 
		if(node.id)
			o.activeNode = node.id();
		else
			o.activeNode = node;

		if( node.isNode == undefined )
			node = o.graph.getElementById(node);

		o.graph.batch(function(){
		o.graph.elements()
		  .removeClass('highlighted')
		  .removeClass('selected')
		  .addClass('faded');

		  node.removeClass('faded')
		      .addClass('selected');
		  
		  node.predecessors().removeClass('faded')
		                  .addClass('highlighted');
		  
		  node.successors().removeClass('faded')  
		                  .addClass('highlighted');
		});
	};

	o.selectNodePermanent = function(node){

		$('.modal-backdrop').remove();

		// node is either a cytoscape node or an id 
		if(node.id)
			o.activeNode = node.id();
		else
			o.activeNode = node;

		if( node.isNode == undefined )
			node = o.graph.getElementById(node);

		o.graph.batch(function(){
		o.graph.elements()
		  .removeClass('highlighted')
		  .removeClass('permanent-selected')
		  .addClass('faded');

		  node.removeClass('faded')
		      .addClass('permanent-selected');
		  
		  node.predecessors().removeClass('faded')
		                  .addClass('highlighted');
		  
		  node.successors().removeClass('faded')  
		                  .addClass('highlighted');
		});		
	};

	o.markNode = function( node ){

		o.graph.batch(function(){
		o.graph.elements()
			.removeClass('highlighted')
			.removeClass('faded')
			.removeClass('marked')

		if(node instanceof Array && node.length == 0){
			o.graph.elements().addClass('unmarked');
		}


		// Array of Ids
		if(node instanceof Array && node.length > 0){

			var selector = [];
			node.map(function(id){
				selector.push('node[id="' + id + '"]')
			})

			var selectorQuery = selector.join(", ");

			o.graph.elements().addClass('unmarked');

			o.graph.$(selectorQuery)
				.removeClass('faded')
				.removeClass('unmarked')
				.addClass('marked');

		}

		// node is either a cytoscape node or an id 
		if(node.id)
			o.activeNode = node.id();
		else
			o.activeNode = node;

		if( node.isNode == undefined )
			node = o.graph.getElementById(node);

			node.removeClass('faded')
				.addClass('marked');

		});
	};

	o.unmarkNodes = function(){

		o.graph.batch(function(){
		o.graph.elements()
			.removeClass('unmarked')
			.removeClass('marked')
			.removeClass('marked-children')
			.removeClass('marked-parent');
		});

		o.removeAdditionalStyles();
	};

	o.runLayout = function(){
	  o.graph.layout().stop(); 
	  layout = o.graph.elements().makeLayout({ 'name': 'cola'}); 
	  layout.start();  	
	};

	return o;
}]);


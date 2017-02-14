// ---------------- Graph Functionality 
angular.module('studionet')

.factory('GraphService', ['$http', 'contributions', function($http, contributions){
	
	var o = {
		activeNode: undefined,
		graph : undefined 
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
	o.getGraph = function( container ){
		var graph_url  = '/graph/all';
		return $http.get(graph_url).success(function(data){

			// make graph with the data - could provide a container id
			o.graph = STUDIONET.GRAPH.makeGraph( data, container ); // defaults to cy

			// notify any controller watching the graph
			notifyObservers();

		});
	};

	//------ Graph Manipulations
	o.removeNode = function(node_id){
		o.graph.getElementById(node_id).remove();
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

		$('.modal-backdrop').remove();

		// node is either a cytoscape node or an id 
		if(node.id)
			o.activeNode = node.id();
		else
			o.activeNode = node;

		if( node.isNode == undefined )
			node = o.graph.getElementById(node);

		// get extra data for the node if not presetn
        if(node.data('db_data') == undefined){
          
          var data = node.data();

          contributions.getContribution(data.id).then(function(res){
              node.data( 'db_data', tagCorrectionFn(res.data) );
              console.log('fetched data');
          });

        }
        else{
          console.log("data already present");
        }

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

		// get extra data for the node if not presetn
        if(node.data('db_data') == undefined){
          
          var data = node.data();

          contributions.getContribution(data.id).then(function(res){
              node.data( 'db_data', tagCorrectionFn(res.data) );
              console.log('fetched data');
          });

        }
        else{
          console.log("data already present");
        }

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


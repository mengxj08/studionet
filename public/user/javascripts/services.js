angular.module('studionet')

.factory('supernode', ['$http', function($http){
	var o ={
		group: -1, 
		contribution: -1
	};

	o.getSupernodes = function(){
		return $http.get('/api/supernode').success(function(data){
			o.group = data.groupId; 
			o.contribution = data.contributionId; 
		});
	};

	return o;
}])

.factory('profile', ['$http', function($http){
	var o ={
		user: {},
		groups: [],
		contributions: [],
		groupsById: {},

	};

	o.getUser = function(){
		return $http.get('/api/profile/').success(function(data){
			angular.copy(data, o.user);
			console.log("Profile Refreshed");
		});
	};

	// redundant
	o.getGroups = function(){
		console.warn("Warning: Usage of Profile Groups in Services");		
		return $http.get('/api/profile/groups').success(function(data){
			angular.copy(data, o.groups);
		});
	};

	// redundant
	o.getContributions = function(){
		console.warn("Warning: Usage of Profile Contributions in Services");		
		return $http.get('/api/profile/contributions').success(function(data){
			angular.copy(data, o.contributions);
		});
	};


	o.changeName = function(user){

	  	$http({
			  method  : 'PUT',
			  url     : '/api/profile/',
			  data    : user,  // pass in data as strings
			  headers : { 'Content-Type': 'application/json' }  // set the headers so angular passing info as form data (not request payload)
			 })
			.success(function(data) {
				o.user = user;
			})
	}

	o.changePicture = function(){
		
	}

	return o;
}])

.factory('users', ['$http', function($http){

	var o = {
		users: [],
		usersHash: []
	};

	o.getAll = function(){
		return $http.get('/api/users').success(function(data){
			angular.copy(data, o.users);
			o.usersHash = o.users.hash();
			console.log("Users Refreshed");
		});
	};

	o.getUser = function(user_id){
		return o.usersHash[user_id];
	}

	o.createNewUser = function(user){
		return $http.post('/api/users', user).success(function(data){
			o.users.push(data);
			o.usersHash[data.id] = data;
		});
	}

	return o;
}])

.factory('tags', ['$http', '$filter', function($http, $filter){

	var o = {
		tags: []
	};

	o.getAll = function(){
		return $http.get('/api/tags').success(function(data){
			// order according to contribution count
			angular.copy($filter('orderBy')(data, 'contributionCount', true) , o.tags);
			console.log("Tags Refreshed");
		});
	};

	// filtering function for tags plugin
	o.loadTags = function(tags, $query){
      return (tags || o.tags).filter(function(tag){
        return tag.name.toLowerCase().search($query.toLowerCase()) != -1;
      });
 	}


	return o;
}])

.factory('contributions', ['$http', 'profile', function($http, profile){

	var o = {
		contributions: [],
		graph: {}
	};

	o.getAll = function(){
		return $http.get('/api/contributions').success(function(data){
			angular.copy(data, o.contributions);
			console.log("Contributions Refreshed");
		});
	};


	return o;
}])

.factory('contribution', ['$http', 'profile', 'contributions', 'tags', 'graph', function($http, profile, contributions, tags, graph){

	var o = {
		contribution: {}
	};

	o.getContribution = function(id){
		return $http.get('/api/contributions/' + id).success(function(data){
				angular.copy(data, o.contribution);
		});
	};

	o.createContribution = function(new_contribution){

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

	    	// mark in graph
	    	console.log("Selecting in graph", res.id, res.id);

			// refresh graph
			graph.getGraph().then(function(){	graph.selectNode(res.id);	});

			// refresh tags
			tags.getAll();
			
			// refresh profile
			profile.getUser();

			// refresh contributions
			contributions.getAll();

			// send success
			return;  
	    })
	    .error(function(error){
			throw error;
	    }) 
	}


	o.updateContribtuion = function(update_contribution){

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
			.success(function(res) {
		    	
				// refresh graph
				graph.getGraph().then(function(){	graph.selectNode(update_contribution.id);	});

				// refresh tags
				tags.getAll();
				
				// refresh profile
				profile.getUser();

				// refresh contributions
				contributions.getAll();

				// send success
				return;  
			})
		    .error(function(error){
				throw error;
	   	 	})	
	}


	o.deleteContribution = function(contribution_id){

		console.log("deleting", contribution_id);
	    return $http({
				method  : 'delete',
				url     : '/api/contributions/' + contribution_id,
				data    : {},  // pass in data as strings
				headers : { 'Content-Type': 'application/json' }  // set the headers so angular passing info as form data (not request payload)
				})
	    .success(function(res) {
			alert(res);
	    })
	    .error(function(error){
			throw error;
	    })		
	
	}


	o.updateViewCount = function(id){
		return $http.post('/api/contributions/' + id + '/view').success(function(data){
			o.contribution.views++;
		});
	};

	o.rateContribution = function(id, rating){
		return $http.post('/api/contributions/' + id + '/rate', {'rating': rating} ).success(function(data){
			console.log(data);
		});
	};


	return o;
}])


.factory('groups', ['$http', 'profile', function($http, profile){

	var o = {
		groups: [],
		graph: {}
	};

	o.getAll = function(){
		return $http.get('/api/groups').success(function(data){
			angular.copy(data, o.groups);
			console.log("Groups Refreshed");
		});
	};

	o.getGraph = function(user_context){
		return $http.get('/graph/all/groups').success(function(data){
			// replace the nodes with the groups that already hold data about the user status in each group
			data.nodes = o.groups;
			// copy data
			angular.copy(data, o.graph);
		});
	};

	o.createNewGroup = function(group){
		return $http.post('/api/groups', group).then(function(response){
			
			var data = response.data;

			console.log("new group created", data);
			
			// refresh groups, the user
			o.getAll();

			profile.getUser();

			return data; 
		
		}, function(error){

			throw error;
		
		});

	}

	o.updateCreate = function( data ){
		
		// update groups
		groups.groups.push(data);
	}

	o.updateDelete = function( data ){
		// update groups
		groups.groups = groups.groups.filter( function(grp){
			console.log(data, "deleted");
			return grp.id != data.id;
		})
	}

	return o;
}])


.factory('group', ['$http', 'profile', 'groups', 'supernode', 'users', function($http, profile, groups, supernode, users){

	var o = {
		group: {},
		users: [],
		user_status: undefined
	};

	var cache = [];

	o.getGroupInfo = function(id){
		return $http.get('/api/groups/' + id).success(function(data){
					
					data.requestingUserStatus = undefined;

					// fix me - find a better way
				/*	for(var i=0; i < profile.user.groups.length; i++){
						if( data.id == profile.groups[i].id ){
								data.requestingUserStatus = profile.groups[i].role;
						}
					}*/

					angular.copy(data, o.group);

					cache[id] = data;



		});		


	};

	o.getGroupUsers = function(id){
		console.log("getting users");
		return $http.get('/api/groups/' + id + '/users').success(function(data){
			angular.copy(data, o.users);

			//o.getGroupPotentials(id);
		});
	};

	/*	o.updateContribution = function(groupDetails){
			return $http.put('/api/groups/'+groupDetails.groupId, groupDetails).success(function(){
				$("#successMsg").show();
				
			});
		};*/

	o.joinGroup = function(){
		return $http.get('/api/groups/' + o.group.id + '/join').success(function(data){
			
			// push the group - id, name, role
			profile.groups.push( {id: o.group.id, name: o.group.name, role: "Member"});

			// fix status in groups & graph
			groups.groups = groups.groups.map(function(group){
				if(group.id == o.group.id){
					group.requestingUserStatus = "Member";
				}

				return group;
			})
			groups.graph.nodes = group.groups;
			
			//
			console.log("joined group", o.group)
		});
	}

	o.leaveGroup = function(){
		return $http.get('/api/groups/' + o.group.id + '/leave').success(function(data){
			
			// remove the group from groups id
			profile.groups = profile.groups.filter( function(obj){ return obj.id!= data.id } );

			// fix status in groups & graph
			groups.groups = groups.groups.map(function(group){
				if(group.id == data.id){
					group.requestingUserStatus = undefined;
				}

				return group;
			})
			//groups.graph.nodes = groups.groups;

			// 
			console.log("Removed from group", data)

		});
	}

	o.addGroupMember = function(data){
		return $http.post('/api/groups/' + o.group.id + '/users', data).success(function(res){
				
			o.group.users.push({ id: data.users[0] })

		});

	};

	o.removeGroupMember = function(data){

		return $http({
		    method: 'DELETE',
		    url: '/api/groups/' + o.group.id + '/users',
		    data: data,
		    headers: {
		        'Content-type': 'application/json;charset=utf-8'
		    }
		}).success( function(res){

			o.group.users = o.group.users.filter( function(user){

				return !(user.id == data.users[0])

			})

		})
	}

	o.updateGroup = function(data){

		return $http({
			  method  : 'PUT',
			  url     : '/api/groups/' + data.id,
			  data    : data,  // pass in data as strings
			  headers : { 'Content-Type': 'application/json' }  // set the headers so angular passing info as form data (not request payload)
			 })
			.success(function(data) {

				//o.getGroupInfo().then( function(){ o.getGroupUsers() });
				console.log("Group edited", data);

				return (data);
			})

	}

	o.deleteGroup = function(){

		return $http.delete('/api/groups/' + o.group.id ).success(function(data){
				
				//groups.updateDelete( data );

		});		
	}

	return o;
}])

.factory('relationships', ['$http', function($http){
	var o = {
		relationships: []
	};

	o.getAll = function(){
		$http.get('/api/relationships/').success(function(data){
			angular.copy(data, o.relationships);
			console.log("Relationships Refreshed");
		});
	}

	return o;
}])

.factory('attachments', ['$http', function($http){
	var o = {
		attachments: []
	}

	o.deleteAttachmentbyId = function(contributionId, attachmentId){
		return $http.delete('/api/contributions/'+contributionId+'/attachments/'+attachmentId)
		.success(function(res) {
			//log success
			console.log("attachment id:" + attachmentId + " has been deleted");

			// send success
			return;  
	    })
	    .error(function(error){
			throw error;
	    })
	}

	return o;
}])

.factory('graph', ['$http', function($http){
	
	var o = {
		container : {},
		activeNode: {},
		url: "/graph/all",  // either graph/all or filters Url
		graph_data: {}, // graph-data
		graph : {} // cytoscape-graph
	};

	var observerCallbacks = [];

	// register an observer
	o.registerObserverCallback = function(callback){
	   observerCallbacks.push(callback);
	};

	// call this when you know 'foo' has been changed
	var notifyObservers = function(){
		angular.forEach(observerCallbacks, function(callback){
	    	 callback();
	    });
	};

	// make the graph
	var makeGraph = function( container ){

		// takes either data from filters or contribution.graph data
		o.graph = STUDIONET.GRAPH.makeGraph( o.graph_data, container ); // defaults to cy
		var cy = o.graph;

		// notify any controller watching of the updated graph
		notifyObservers();
	}


	// get the graph from the URL
	o.getGraph = function( container ){

		o.container = container;

		return $http.get(o.url).success(function(data){
			
			filterUrl = "";

			// copy data
			angular.copy(data, o.graph_data);
			console.log("Graph Refreshed");

			// make graph with the data - could provide a container id
			makeGraph( container );

		});
	}

	// Styling Options
	o.removeAdditionalStyles = function(){
	  	o.graph.batch(function(){

	      o.graph.elements()
	        .removeClass('highlighted')
	        .removeClass('selected')
	        .removeClass('faded');
	  	});          

	  	o.activeNode = {};
	}

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

	}

	o.markNode = function( node ){

		o.graph.batch(function(){
		o.graph.elements()
			.removeClass('highlighted')
			.removeClass('highlighted')
			.removeClass('marked')
			.addClass('faded');

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

/*			o.graph.$(selectorQuery).predecessors()
								.removeClass('unmarked')
								.removeClass('faded')
								.addClass('marked-parent');

			o.graph.$(selectorQuery).successors()
							.removeClass('faded')  
							.removeClass('unmarked')
							.addClass('marked-children');*/

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
/*
			node.predecessors().removeClass('faded')
								.addClass('marked-parent');

			node.successors().removeClass('faded')  
							.addClass('marked-children');*/

		});

	}

	o.unmarkNodes = function(){

		o.graph.batch(function(){
		o.graph.elements()
			.removeClass('unmarked')
			.removeClass('marked')
			.removeClass('marked-children')
			.removeClass('marked-parent');
		});

		o.removeAdditionalStyles();

	}

	o.runLayout = function(){
	  o.graph.layout().stop(); 
	  layout = o.graph.elements().makeLayout({ 'name': 'cola'}); 
	  layout.start();  	
	}


	return o;
}])

/*
 *   General Function
 */

Array.prototype.hash = function(){
	
	var hash = [];

	this.map(function(a){
		hash[a.id] = a;
	})
	
	return hash;

}
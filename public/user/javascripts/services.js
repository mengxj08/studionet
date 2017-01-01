angular.module('studionet')

// todo
.service('AppContextService', function(){
    
    var o = {
    	graph: null
    }

    o.getGraph = function(){
    	//console.log("getting graph");
    	return o.graph;
    }

    o.setGraph = function( graph_value ){
    	o.graph = graph_value;
    	//console.log("setting graph");
    }

    return o; 
})

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
		groupsById: {}
	};

	o.getUser = function(){
		return $http.get('/api/profile/').success(function(data){
			angular.copy(data, o.user);
		});
	};

	// redundant
	o.getGroups = function(){
		console.warn("Shouldn't be using this");
		return $http.get('/api/profile/groups').success(function(data){
			angular.copy(data, o.groups);
		});
	};

	// redundant
	o.getContributions = function(){
		console.warn("Shouldn't be using this");		
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

/*
.factory('graphs', ['$http', 'groups', function($http, groups){

	var o = {
		contribution: {},
		groups: {}
	};

	o.getContributionsGraph = function(){
		return $http.get("/graph/all").success(function(data){
			angular.copy(data, o.contribution);
		});
	};

	o.filterContributions = function(){
		return $http.get(urlString).success(function(data){
			//$scope.graphInit(data);
		});
	}

	o.getGroupsGraph = function(user_context){
		return $http.get('/graph/all/groups').success(function(data){
			// replace the nodes with the groups that already hold data about the user status in each group
			data.nodes = groups.groups;
			// copy data
			angular.copy(data, o.groups);
		});
	};

	o.drawGraph = function(){

	}


}])*/


.factory('users', ['$http', function($http){

	var o = {
		users: [],
		usersById: {}
	};

	o.getAll = function(){
		return $http.get('/api/users').success(function(data){
			angular.copy(data, o.users);
		});
	};

	o.usersById = function(){

			var arr = {};
			o.users.map(function(user){
				arr[user.id] = user;
			})

			return arr;
	}

	o.createNewUser = function(user){
		return $http.post('/api/users', user).success(function(data){
			o.users.push(data);
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
		});
	};

	return o;
}])


.factory('contributions', ['$http', 'profile', function($http, profile){

	var o = {
		contributions: [],
		graph: {},
		marked: []
	};

	o.getAll = function(){
		return $http.get('/api/contributions').success(function(data){
			angular.copy(data, o.contributions);
		});
	};

	o.getGraph = function(){
		return $http.get("/graph/all").success(function(data){

			// mark the nodes owned by the user
			var contributionHash = o.contributions.hash();
			data.nodes = data.nodes.map(function(node){

					// find if contribution is owned by user
					if( contributionHash[node.id].createdBy == profile.user.id ){
						node.owner = true;
					}
					else
						node.owner = false;

					// check if contribution was recently created and hence marked 
					if( o.marked.indexOf( node.id ) > -1)
						node.marked = true;
					else
						node.marked = false;

					return node;
			})

			angular.copy(data, o.graph);

		});
	};

	return o;
}])

.factory('contribution', ['$http', 'profile', 'contributions', function($http, profile, contributions){

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

		new_contribution.attachments.map(function(file){
			formData.append('attachments', file, file.name);
		})

	    return $http({
	      method  : 'POST',
	      url     : '/api/contributions',
	      headers : { 'Content-Type': undefined, 'enctype':'multipart/form-data; charset=utf-8' },
      	  processData: false,
          data: formData
	    })
	    .success(function(res) {

	    	// mark in graph
	    	contributions.marked.push(res.id);
	    	console.log(res.id);

			// refresh graph
			
			// refresh tags
			

			// refresh profile

			// refresh contributions
			

			// send success
			return res;  
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
			// $scope.close();
			// $scope.refresh();  
			// $scope.$parent.graphInit();
			// 
			// if filter active, re-render filter
			// else render entire graph
			
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
		//formData.append('refType', update_contribution.refType);
		formData.append('contentType', update_contribution.contentType);
		formData.append('ref', update_contribution.ref);

		update_contribution.attachments.map(function(file){
			formData.append('attachments', file, file.name);
		})
		for (var key of formData.entries()) {
        	console.log(key[0] + ', ' + key[1]);
    	}

		return $http({
			  method  : 'PUT',
			  url     : '/api/contributions/'+ update_contribution.id,
			  headers : { 'Content-Type': undefined, 'enctype':'multipart/form-data; charset=utf-8' },
      	      processData: false,
              data: formData
			 })
			.success(function(res) {
				console.log("Contribution edited", res);
				return (res);
			})
		    .error(function(error){
				throw error;
	   	 	})	
	}

	o.updateViewCount = function(id){
		return $http.post('/api/contributions/' + id + '/view').success(function(data){
			o.contribution.views += 1;
			console.log(data);
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
			
			// add the group to the user profile
			profile.groups.push({ id: data.id , name: data.name , role: "Admin" })

			// add group to groups array
			o.groups.push(data);
			
			// correct nodes for graph
			o.graph.nodes = o.groups;

			// handle links for subgroups

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
		});
	}

	return o;
}])

.factory('modelsFactory', ['$http', function($http){
	var o = {
		userModels: []
	};

	o.getUserModels = function(nusOpenId){
		return $http.get('/uploads/' + nusOpenId + '/models').success(function(data){
			angular.copy(data, o.userModels);
		});
	}

	return o;
}]);


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
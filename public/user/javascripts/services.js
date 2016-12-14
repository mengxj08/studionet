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
		groupsById: {}
	};

	o.getUser = function(){
		return $http.get('/api/profile/user').success(function(data){
			angular.copy(data, o.user);
		});
	};

	o.getGroups = function(){
		return $http.get('/api/profile/groups').success(function(data){
			angular.copy(data, o.groups);
		});
	};

	o.getContributions = function(){
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
}])

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

.factory('groups', ['$http', function($http){

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
		return $http.post('/api/groups', group).then(function(data){
			
			console.log("new group created", data);
			o.groups.push(data);
		
		}, function(error){
			
			console.log(error);
			
		});
	}

	return o;
}])

.factory('tags', ['$http', function($http){

	var o = {
		tags: []
	};

	o.getAll = function(){
		return $http.get('/api/tags').success(function(data){
			angular.copy(data, o.tags);
		});
	};

	return o;
}])


.factory('contributions', ['$http', function($http){

	var o = {
		contributions: []
	};

	o.getAll = function(){
		return $http.get('/api/contributions').success(function(data){
			angular.copy(data, o.contributions);
		});
	};

	return o;
}])

.factory('group', ['$http', function($http){

	var o = {
		group: {},
		users: [],
	};

	o.getGroupInfo = function(id){
		return $http.get('/api/groups/' + id).success(function(data){
			angular.copy(data, o.group);
		});
	};

	o.getGroupUsers = function(id){
		return $http.get('/api/groups/' + id + '/users').success(function(data){
			angular.copy(data, o.users);
		});
	};

	o.updateContribution = function(groupDetails){
		return $http.put('/api/groups/'+groupDetails.groupId, groupDetails).success(function(){
			$("#successMsg").show();
			
		});
	};

	o.addGroupMember = function(data){
		
		return $http.post('/api/groups/' + o.group.id + '/users', data).success(function(data){
			alert("Added to group")
		});
	};

	o.removeGroupMember = function(data){
		return $http.delete('/api/groups/' + o.group.id + '/users/' + data.userId, {params: data}).success(function(data){
			alert("Removed from group")
		});		
	}

	o.deleteGroup = function(){
		return $http.delete('/api/groups/' + o.group.id ).success(function(data){
			alert("Group Deleted");
		});		
	}

	return o;
}])

;
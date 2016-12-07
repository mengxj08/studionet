angular.module('studionet')

.factory('profile', ['$http', function($http){
	var o ={
		user: {},
		groups: [],
		contributions: []
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

	o.getGraph = function(){
		return $http.get('/graph/all/groups').success(function(data){
			angular.copy(data, o.graph);
		});
	};

	o.createNewGroup = function(user){
		return $http.post('/api/groups', user).success(function(data){
			o.users.push(data);
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
		relation: {}
	};

	o.getModuleInfo = function(id){
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

	o.addStudent = function(linkDetails){
		
		return $http.post('/api/groups/' + linkDetails.moduleId + '/users',linkDetails).success(function(data){
			
			$("#successMsg").show();

			angular.copy(data, o.relation);
		});
	};
	return o;
}])

;
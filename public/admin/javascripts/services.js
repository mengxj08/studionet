angular.module('studionetAdmin')

.factory('modules', ['$resource', function($resource){
	// trying out $resource instead of $http
	return $resource('/api/modules/:id', {}, {
		update: {
			method: 'PUT'
		}
	});
}])

.factory('users', ['$http', function($http){
	/*
	return $resource('/api/users/:id', {}, {
		update: {
			method: 'PUT'
		}
	});
	*/

	var o = {
		users: []
	};

	o.getAll = function(){
		return $http.get('/api/users').success(function(data){
			angular.copy(data, o.users);
		});
	};


	o.createNewUser = function(user){
		return $http.post('/api/users', user).success(function(data){
			o.users.push(data);
		});
	}

	return o;
}])

.factory('groups', ['$http', function($http){

	var o = {
		groups: []
	};

	o.getAll = function(){
		return $http.get('/api/groups').success(function(data){
			angular.copy(data, o.groups);
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
}]);
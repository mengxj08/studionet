angular.module('studionet')

.factory('profile', ['$http', function($http){
	var o ={
		user: {},
		modules: [],
	};

	o.getUser = function(){
		return $http.get('/api/profile/user').success(function(data){
			angular.copy(data, o.user);
		});
	};

	o.getModules = function(){
		return $http.get('/api/profile/modules').success(function(data){
			angular.copy(data, o.modules);
		});
	};

	o.getModules = function(){
		return $http.get('/api/profile/modules').success(function(data){
			angular.copy(data, o.modules);
		});
	};

	return o;
}])

.factory('module', ['$http', function($http){

	var o = {
		module: {},
		users: [],
		relation: {}
	};

	o.getModuleInfo = function(id){
		return $http.get('/api/modules/' + id).success(function(data){
			angular.copy(data, o.module);
		});
	};

	o.getModuleUsers = function(id){
		return $http.get('/api/modules/' + id + '/users').success(function(data){
			angular.copy(data, o.users);
		});
	};

	o.updateContribution = function(moduleDetails){
		return $http.put('/api/modules/'+moduleDetails.moduleId, moduleDetails).success(function(){
			$("#successMsg").show();
			
		});
	};

	o.addStudent = function(linkDetails){
		
		return $http.post('/api/modules/' + linkDetails.moduleId + '/users',linkDetails).success(function(data){
			
			$("#successMsg").show();

			angular.copy(data, o.relation);
		});
	};
	return o;
}])

.factory('users', ['$http', function($http){

	var o = {
		users: []
	};

	o.getAllUsers = function(){
		return $http.get('/api/users').success(function(data){
			angular.copy(data, o.users);
		});
	};
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
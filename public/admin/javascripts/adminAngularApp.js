var app = angular.module('studionetAdmin', ['ui.router', 'ngResource', 'ngTagsInput']);

app.config(['$stateProvider', '$urlRouterProvider', 'tagsInputConfigProvider', function($stateProvider, $urlRouterProvider, tagsInputConfigProvider){

	// admin 'routes'
	$stateProvider
		.state('home', {
			url: '/',
			templateUrl: '/admin/templates/home.html',
			controller: 'HomeCtrl',
			resolve: {
				usersPromise: ['users', function(users){
					return users.getAll();
				}],
				// get modules data before page loads
				modulesPromise: ['modules', function(modules){
					return modules.query();
				}]
			}
		})
		/*
		 *  Should be remove in production; 
		 *  Only for testing purposes to create synthetic data set
		 *  Remove TestCtrl from HomeCtrl file
		 */ 
		.state('testing', {
			url: '/tests',
			templateUrl: '/admin/templates/testing.html',
			controller: 'TestCtrl'
		})
		.state('groups', {
			url: '/groups',
			templateUrl: '/admin/templates/groups.html',
			controller: 'ModulesCtrl',
			resolve: {
				usersPromise: ['users', function(users){
					return users.getAll();
				}],
				// get modules data before page loads
				modulesPromise: ['modules', function(modules){
					return modules.query();
				}]
			}
		})
		.state('group', {
			url: '/groups/:id',
			templateUrl: '/admin/templates/module.html',
			controller: 'ModuleCtrl',
			resolve: {
				// get data first
				modulePromise: ['$q', 'modules', '$stateParams', function($q, modules, $stateParams){
					var defer = $q.defer();
				  modules.get({id: $stateParams.id}, function(module){
						defer.resolve(module);
					});
					return defer.promise;
				}]
			}
		})
		.state('contributions', {
			url: '/contributions',
			templateUrl: '/admin/templates/contributions.html',
			controller: 'ModulesCtrl',
			resolve: {
				usersPromise: ['users', function(users){
					return users.getAll();
				}],
				// get modules data before page loads
				modulesPromise: ['modules', function(modules){
					return modules.query();
				}]
			}
		})		
		.state('users', {
			url: '/users',
			templateUrl: '/admin/templates/users.html',
			controller: 'UsersCtrl',
			resolve: {
				usersPromise: ['users', function(users){
					return users.getAll();
				}]
			}
		})
		.state('tags', {
			url: '/tags',
			templateUrl: '/admin/templates/tags.html',
			controller: 'HomeCtrl',
			resolve: {
				usersPromise: ['users', function(users){
					return users.getAll();
				}]
			}
		});

	$urlRouterProvider.otherwise('/');

	tagsInputConfigProvider
		.setDefaults('tagsInput', {
			placeholder: 'Contribution Types'
		});
}]);
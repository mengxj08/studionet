var app = angular.module('studionet', ['ui.router','ui.bootstrap', 'ngTagsInput', 'ngFileUpload', 'angularModalService', 'multiselect-searchtree', 'angular-ranger'])
									.run(function($rootScope){
/*									    $rootScope.value = {
									        min: 5,
									        max: 18,
									        value: 12
									    };*/
									});


app.config(['$stateProvider', '$urlRouterProvider', 'tagsInputConfigProvider', function($stateProvider, $urlRouterProvider, tagsInputConfigProvider){

	// user 'routes'
	$stateProvider
		.state('home', {
			url: '/',
			templateUrl: '/user/templates/home.html',
			controller: 'HomeCtrl',
			resolve: {
				userProfile: ['profile', function(profile){
					return profile.getUser() && profile.getModules();
				}],
				userModels: ['modelsFactory', 'userProfile', 'profile', function(modelsFactory, userProfile, profile){
					return modelsFactory.getUserModels(profile.user.nusOpenId);
				}]

			}
		})
		.state('user', {
			abstract: true,
			url: '/me',
			templateUrl: '/user/templates/user.html',
			controller: 'UserCtrl',
			resolve: {
				userProfile: ['profile', function(profile){
					return profile.getUser() && profile.getModules();
				}],
				userModels: ['modelsFactory', 'userProfile', 'profile', function(modelsFactory, userProfile, profile){
					return modelsFactory.getUserModels(profile.user.nusOpenId);
				}]

			}
		})
		.state('user.details', {
			url: '/details',
			templateUrl: '/user/templates/user.details.html',
			controller: 'ProfileCtrl',
			resolve: {
				userProfile: ['profile', function(profile){
					return profile.getUser() && profile.getModules();
				}],
				userModels: ['modelsFactory', 'userProfile', 'profile', function(modelsFactory, userProfile, profile){
					return modelsFactory.getUserModels(profile.user.nusOpenId);
				}]

			}
		})
		.state('user.groups', {
			url: '/groups',
			templateUrl: '/user/templates/user.groups.html',
			controller: 'GroupsCtrl',
			resolve: {
				userProfile: ['profile', function(profile){
					return profile.getUser() && profile.getModules();
				}],
				userModels: ['modelsFactory', 'userProfile', 'profile', function(modelsFactory, userProfile, profile){
					return modelsFactory.getUserModels(profile.user.nusOpenId);
				}]

			}
		})

	$urlRouterProvider.otherwise('/');
}]);

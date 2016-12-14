var app = angular.module('studionet', ['ngAnimate', 'ngSanitize','ui.router','ui.bootstrap', 'ngTagsInput', 'ngFileUpload', 'angularModalService', 'multiselect-searchtree', 'angular-ranger'])

app.config(['$stateProvider', '$urlRouterProvider', 'tagsInputConfigProvider', function($stateProvider, $urlRouterProvider, tagsInputConfigProvider){

	// user 'routes'
	$stateProvider
		.state('home', {
			url: '/',
			templateUrl: '/user/templates/home.html',
			controller: 'HomeCtrl',
			resolve: {
				userProfile: ['profile', function(profile){
					return profile.getUser() && profile.getGroups();
				}],
				usersPromise: ['users', function(users){ 
					return users.getAll();
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
					return profile.getUser() && profile.getGroups();
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
					return profile.getUser() && profile.getGroups() && profile.getContributions();
				}]
			}
		})
		.state('user.groups', {
			url: '/groups',
			templateUrl: '/user/templates/user.groups.html',
			controller: 'GroupsCtrl',
			resolve: {
				supernode: ['supernode', function(supernode){
					return supernode.getSupernodes();
				}],
				userProfile: ['profile', function(profile){
					return profile.getUser() && profile.getGroups();
				}],
				groupsPromise: ['groups', function(groups){
					return groups.getAll().then( function(){ return groups.getGraph() });
				}],
				usersPromise: ['users', function(users){
					return users.getAll();
				}]

			}
		})

	$urlRouterProvider.otherwise('/');
}]);

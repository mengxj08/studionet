var app = angular.module('studionet', ['ngAnimate', 'ngSanitize','ui.router','ui.bootstrap', 'ngTagsInput', 'ngFileUpload', 'angularModalService', 'multiselect-searchtree', 'angular-ranger'])

app.config(['$stateProvider', '$urlRouterProvider', 'tagsInputConfigProvider', function($stateProvider, $urlRouterProvider, tagsInputConfigProvider){

	// user 'routes'
	$stateProvider
		.state('home', {
			abstract: true,
			url: '/'
		})
		.state('contributions', {
			url: '/contributions',
			templateUrl: '/user/templates/contributions.html',
			controller: 'ContributionsCtrl',
			resolve: {
				userProfile: ['profile', function(profile){
					return profile.getUser() && profile.getGroups();
				}],
				usersPromise: ['users', function(users){ 
					return users.getAll();
				}]
			}
		})
		.state('profile', {
			url: '/profile',
			templateUrl: '/user/templates/profile.html',
			controller: 'ProfileCtrl',
			resolve: {
				userProfile: ['profile', function(profile){
					return profile.getUser() && profile.getGroups() && profile.getContributions();
				}]
			}
		})
		.state('groups', {
			url: '/groups',
			templateUrl: '/user/templates/groups.html',
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

	$urlRouterProvider.otherwise('/contributions');
}]);

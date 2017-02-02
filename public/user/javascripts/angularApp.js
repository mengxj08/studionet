var app = angular.module('studionet', ['ngAnimate', 'ngSanitize','ui.router','ui.bootstrap', 
										'ngTagsInput', 'ngFileUpload', 'angularModalService', 'multiselect-searchtree', 
										'angular-ranger','textAngular',
										'contributionEditorDirective'])

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
				supernodePromise: ['supernode', function(supernode){
					return supernode.getSupernodes();
				}],
				tagsPromise: ['tags', function(tags){
					return tags.getAll();
				}],
				groupsPromise: ['groups', function(groups){
					return groups.getAll() && groups.getGraph();
				}],
				/*contributionsPromise: ['contributions', function(contributions){
					return contributions.getAll();
				}],*/
				usersPromise: ['users', function(users){ 
					return users.getAll();
				}],
				relationshipsPromise: ['relationships', function(relationships){ 
					return relationships.getAll();
				}],
				userProfile: ['profile', function(profile){
					return profile.getUser();
				}]
			}
		})
		.state('contribution', {
			url: '/contributions/:contributionId',
			templateUrl: '/user/templates/contributions.html',
			controller: 'ContributionsCtrl',
			resolve: {
				supernodePromise: ['supernode', function(supernode){
					return supernode.getSupernodes();
				}],
				tagsPromise: ['tags', function(tags){
					return tags.getAll();
				}],
				groupsPromise: ['groups', function(groups){
					return groups.getAll() && groups.getGraph();
				}],
				/*contributionsPromise: ['contributions', function(contributions){
					return contributions.getAll();
				}],*/
				usersPromise: ['users', function(users){ 
					return users.getAll();
				}],
				userProfile: ['profile', function(profile){
					return profile.getUser();
				}]
			}
		})
		.state('groups', {
			url: '/groups',
			templateUrl: '/user/templates/groups.html',
			controller: 'GroupsCtrl',
			resolve: {
				supernodePromise: ['supernode', function(supernode){
					return supernode.getSupernodes();
				}],
				tagsPromise: ['tags', function(tags){
					return tags.getAll();
				}],
				groupsPromise: ['groups', function(groups){
					return groups.getAll() && groups.getGraph();
				}],
				contributionsPromise: ['contributions', function(contributions){
					return contributions.getAll();
				}],
				usersPromise: ['users', function(users){ 
					return users.getAll();
				}],
				userProfile: ['profile', function(profile){
					return profile.getUser();
				}]
			}
		})

	$urlRouterProvider.otherwise('/contributions');

}]);

//textAngular toolbar customisation
app.config(function($provide) {
    $provide.decorator('taOptions', ['$delegate', function(taOptions) {
    	taOptions.toolbar = [
      	['clear', 'h1', 'h2', 'h3', 'p', 'ul', 'ol',
      	'justifyLeft', 'justifyCenter', 'justifyRight', 'indent', 'outdent', 'html','insertLink', 'insertVideo']];
  		return taOptions;
    }]);
});
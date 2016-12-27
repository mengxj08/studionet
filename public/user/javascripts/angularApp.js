var app = angular.module('studionet', ['ngAnimate', 'ngSanitize','ui.router','ui.bootstrap', 'ngTagsInput', 'ngFileUpload', 'angularModalService', 'multiselect-searchtree', 'angular-ranger','textAngular'])

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
				contributionsPromise: ['contributions', function(contributions){
					return contributions.getAll() && contributions.getGraph();
				}],
				usersPromise: ['users', function(users){ 
					return users.getAll();
				}],
				userProfile: ['profile', function(profile){
					return profile.getUser();
				}]
			}
		})
		.state('profile', {
			url: '/profile',
			templateUrl: '/user/templates/profile.html',
			controller: 'ProfileCtrl',
			resolve: {
				userProfile: ['profile', function(profile){
					return profile.getUser() /*&& profile.getGroups() && profile.getContributions()*/;
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
					return profile.getUser() /*&& profile.getGroups()*/;
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

//textAngular toolbar customisation
app.config(function($provide) {
    $provide.decorator('taOptions', ['$delegate', function(taOptions) {
    	taOptions.toolbar = [
      	['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'pre', 'quote'],
      	['bold', 'italics', 'underline', 'strikeThrough', 'ul', 'ol', 'undo', 'redo', 'clear'],
      	['justifyLeft', 'justifyCenter', 'justifyRight', 'indent', 'outdent'],
      	['html', 'insertImage','insertLink', 'insertVideo']
  		];
  		return taOptions;
    }]);
});
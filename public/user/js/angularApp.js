var app = angular.module('studionet', ['ngAnimate', 'ngSanitize','ui.router','ui.bootstrap', 
										'ngTagsInput', 'ngFileUpload', 'angularModalService', 'multiselect-searchtree', 
										'angular-ranger','textAngular']);

// angular routing
app.config(['$stateProvider', '$urlRouterProvider', 'tagsInputConfigProvider', function($stateProvider, $urlRouterProvider, tagsInputConfigProvider){

	// user 'routes'
	$stateProvider
		.state('home', {
			abstract: true,
			url: '/'
		})
		.state('contributions', {
			url: '/contributions',
			templateUrl: '/user/templates/app.html',
			controller: 'MainController',
			resolve: {
				supernodePromise: ['supernode', function(supernode){
					return supernode.getSupernodes();
				}],
				tagsPromise: ['tags', function(tags){
					return tags.getAll();
				}],
				groupsPromise: ['groups', function(groups){
					return groups.getAll();
				}],
				usersPromise: ['users', function(users){ 
					return users.getAll();
				}],
				userProfile: ['profile', function(profile){
					return profile.getUser() && profile.getActivity();
				}]
			}
		})
		.state('contribution', {
			url: '/contributions/:contributionId',
			templateUrl: '/user/templates/app.html',
			controller: 'MainController',
			resolve: {
				supernodePromise: ['supernode', function(supernode){
					return supernode.getSupernodes();
				}],
				tagsPromise: ['tags', function(tags){
					return tags.getAll();
				}],
				groupsPromise: ['groups', function(groups){
					return groups.getAll();
				}],
				usersPromise: ['users', function(users){ 
					return users.getAll();
				}],
				userProfile: ['profile', function(profile){
					return profile.getUser() && profile.getActivity();
				}]
			}
		})

	$urlRouterProvider.otherwise('/contributions');

}]);


// textAngular toolbar customisation
app.config(function($provide) {
    $provide.decorator('taOptions', ['$delegate', function(taOptions) {
    	taOptions.toolbar = [
      	['clear', 'h1', 'h2', 'h3', 'p', 'ul', 'ol',
      	'justifyLeft', 'justifyCenter', 'justifyRight', 'indent', 'outdent', 'html','insertLink', 'insertVideo']];
  		return taOptions;
    }]);
});
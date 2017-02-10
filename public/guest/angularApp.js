var app = angular.module('studionetGuest', ['ngAnimate', 'ngSanitize','ui.router','ui.bootstrap', 
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
				usersPromise: ['users', function(users){ 
					return users.getAll();
				}],
				relationshipsPromise: ['relationships', function(relationships){ 
					return relationships.getAll();
				}]
			}
		});

	$urlRouterProvider.otherwise('/contributions');

}]);


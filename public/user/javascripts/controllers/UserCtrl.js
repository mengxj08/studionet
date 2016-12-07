angular.module('studionet')


/*
 * Abstract User Page Placeholder
 */
.controller('UserCtrl', ['$scope', 'profile', function($scope, profile){
	
	$scope.user = profile.user;
	$scope.groups = profile.groups;
	
}])



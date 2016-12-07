angular.module('studionetAdmin')

.controller('GroupsCtrl', ['$scope', 'groups', function($scope, groups){

	$scope.groups = groups.groups;
	console.log($scope.groups);
	// $scope.modules = modules.query();
	// get modules data before page loads
	
}]);
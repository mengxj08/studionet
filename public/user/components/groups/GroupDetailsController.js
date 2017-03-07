angular.module('studionet')

.controller('GroupDetailsController', ['$scope',  '$filter', 'groups', 'profile', 'users', function($scope, $filter, groups, profile, users){

	$scope.group = "some group";

	$scope.$on('group_details', function(event, args){

		$scope.group = args.group;
	
		// get user activity for the group



	})

	$scope.back = function(){
		$scope.$emit('group_details_closed');
	}

}]);

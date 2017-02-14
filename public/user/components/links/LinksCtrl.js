angular.module('studionet')

/*
 *	Controller for Groups
 * 
 */
.controller('LinksCtrl', ['$scope', function($scope){

	$scope.linkData;

	$scope.setData = function(data){
		console.log("setting data for links", data);
		$scope.linkData = data; 
	}

}]);
angular.module('studionet')

/*
 * Controller for Filters
 */
.controller('NavCtrl', ['$scope', '$http', 'profile', function($scope, $http, profile){

		$scope.user = profile.user;
		$scope.filters = profile.user.filterNames || []; 
		$scope.filters_ref = profile.user.filters || []; 


}]);
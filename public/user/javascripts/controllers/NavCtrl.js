angular.module('studionet')

/*
 * Controller for Filters
 */
.controller('NavCtrl', ['$scope', '$http', 'profile', function($scope, $http, profile){

		$scope.user = profile.user;

}]);
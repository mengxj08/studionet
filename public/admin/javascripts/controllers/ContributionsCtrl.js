angular.module('studionetAdmin')

.controller('ContributionsCtrl', ['$scope', '$stateParams', 'contributions', function($scope, $stateParams, contributions){

	$scope.contributions = contributions.contributions;


}]);
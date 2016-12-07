angular.module('studionetAdmin')

.controller('TagsCtrl', ['$scope', 'tags', function($scope, tags){

	$scope.tags = tags.tags;

}])
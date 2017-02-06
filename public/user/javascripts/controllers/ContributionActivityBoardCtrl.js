angular.module('studionet')

.controller('ContributionActivityBoardCtrl', ['$scope', 'contributions', '$filter', 'graph', 'users', function($scope, contributions, $filter, graph, users){

	$scope.sortType     = 'dateCreated'; // set the default sort type
	$scope.sortReverse  = true;  // set the default sort order
	$scope.searchContribution   = '';     // set the default search/filter term

	$scope.contributions = [];

	$scope.users = users.usersHash;

	contributions.getAll().success(function(data){
		$scope.contributions = contributions.contributions;

		$scope.latest = $filter('orderBy')($scope.contributions, '-dateCreated')[0];
		$scope.highestRating = $filter('orderBy')($scope.contributions, '-totalRatings')[0];
		$scope.mostViewed = $filter('orderBy')($scope.contributions, '-views')[0];
	})

	//----- Pagination
	$scope.itemsPerPage = 5;
	$scope.maxSize = 5; 
	$scope.currentPage = 1; 

	// ---- graph selections
	$scope.goToNode = function(node_id){
		graph.selectNode(node_id);
		$scope.close();
	}


	//  This close function doesn't need to use jQuery or bootstrap, because
	//  the button has the 'data-dismiss' attribute.
	$scope.close = function() {
	  $('body').removeClass('modal-open');
	  $('.modal-backdrop').remove();
	};


}]);
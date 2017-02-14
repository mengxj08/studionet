angular.module('studionet')

.controller('NodeBoardController', ['$scope',  '$filter', 'GraphService', 'users', function($scope, $filter, GraphService, users){

	$scope.sortType     = 'dateCreated'; // set the default sort type
	$scope.sortReverse  = true;  // set the default sort order
	$scope.searchContribution   = '';     // set the default search/filter term

	$scope.contributions = []; 

	$scope.users = users.usersHash;

	// Observe the Graph Service for Changes and register observer
	var updateBoard = function(){
		$scope.contributions = []; 

		GraphService.graph.nodes().map(function(node){
			$scope.contributions.push(node.data());
		})

	  	$scope.latest = $filter('orderBy')($scope.contributions, '-dateCreated')[0];
		$scope.highestRating = $filter('orderBy')($scope.contributions, '-totalRatings')[0];
		$scope.mostViewed = $filter('orderBy')($scope.contributions, '-views')[0];
	};
	GraphService.registerObserverCallback(updateBoard);



	//----- Pagination
	$scope.itemsPerPage = 15;
	$scope.maxSize = 5; 
	$scope.currentPage = 1; 

	// ---- graph selections
	$scope.goToNode = function(node_id){
		GraphService.selectNode(node_id);
		$scope.close();
	}

	$scope.processName = function(name){

		if(name && name.length > 23)
			return name.substr(0, 23) + "..."
		else 
			return name;
	}


	//  This close function doesn't need to use jQuery or bootstrap, because
	//  the button has the 'data-dismiss' attribute.
	$scope.close = function() {
	  $('body').removeClass('modal-open');
	  $('.modal-backdrop').remove();
	};


}]);
angular.module('studionet')

.controller('GroupBoardController', ['$scope',  '$filter', 'groups', 'profile', 'users', function($scope, $filter, groups, profile, users){

	$scope.sortType     = 'avg_level'; // set the default sort type
	$scope.sortReverse  = true;  // set the default sort order
	$scope.searchGroup   = '';     // set the default search/filter term

	$scope.groups = groups.groups;

	$scope.user = profile.user;

	$scope.createGroup = false;

	var computeGroupRanks = function(){

		for(var i=0; i < $scope.groups.length; i++){
				
			var group = $scope.groups[i];

			var sum = 0;
			for( var j=0; j < group.members.length; j++ ){
				sum += users.usersHash[group.members[j].id].level;
			}

			group.avg_level = parseInt((sum / group.members.length).toFixed(0));
		}

	}
	computeGroupRanks();

	// Observe the Graph Service for Changes and register observer
	var updateBoard = function(){
		$scope.groups = []; 
		$scope.groups = groups.groups;
		computeGroupRanks();
	};

	$scope.$on('close_group_creation', function(){
		$scope.createGroup = false;
	});

	$scope.$on('group_details_closed', function(){
		$scope.groupDetails = false;
	});



	$scope.showGroupDetails = function(group){
		$scope.groupDetails = true;

		$scope.$broadcast('group_details', { group: group });

	}


	//----- Pagination
	$scope.itemsPerPage = 5;
	$scope.maxSize = 5; 
	$scope.currentPage = 1; 


	//  This close function doesn't need to use jQuery or bootstrap, because
	//  the button has the 'data-dismiss' attribute.
	$scope.close = function() {
	  $('body').removeClass('modal-open');
	  $('.modal-backdrop').remove();
	};


}]);

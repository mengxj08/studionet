angular.module('studionet')

.controller('UserActivityBoardCtrl', ['$scope', 'users', function($scope, users){

		$scope.sortType     = 'lastLoggedIn'; // set the default sort type
		$scope.sortReverse  = true;  // set the default sort order
		$scope.searchUser   = '';     // set the default search/filter term

		$scope.users = users.users.filter(function(u){
				return !u.isAdmin;
		});

		var topViews = 0, topViewer = $scope.users[0]; 
		var topRatings = 0, topRater = $scope.users[0];  
		var topCreations = 0, topCreator = $scope.users[0]; 
		for(var i=0; i < $scope.users.length; i++){

			var user = $scope.users[i];
			var activityArr = user.activityArr;

			if(user.isAdmin)
				continue;

			// break ties by last logged in
			if(activityArr[0] > topViews || ( (activityArr[0] == topViews) && (user.lastLoggedIn > topViewer.lastLoggedIn))){
				topViews = activityArr[0];
				topViewer = user;
			}

			if(activityArr[1] > topRatings || ( (activityArr[1] == topRatings) && (user.lastLoggedIn > topRater.lastLoggedIn))){
				topRatings = activityArr[1];
				topRater = user;
			}

			if(activityArr[2] > topCreations || ( (activityArr[2] == topCreations) && (user.lastLoggedIn > topCreator.lastLoggedIn))){
				topCreations = activityArr[2];
				topCreator = user;
			}

		}

		$scope.topViewer = topViewer;
		$scope.topRater = topRater;
		$scope.topCreator = topCreator;

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
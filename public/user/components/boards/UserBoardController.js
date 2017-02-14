angular.module('studionet')

.controller('UserBoardController', ['$scope', 'users', function($scope, users){

		$scope.sortType     = 'lastLoggedIn'; // set the default sort type
		$scope.sortReverse  = true;  // set the default sort order
		$scope.searchUser   = '';     // set the default search/filter term

		/*$scope.users = users.users.filter(function(u){
				return !u.isAdmin;
		});*/

		$scope.users = users.users;

		var topViews = 0, topRating = 0, topCreations = 0, topViewer, topRater, topCreator;

		for(var i=0; i < $scope.users.length; i++){

			var user = $scope.users[i];
			var activityArr = user.activityArr;

			if(user.isAdmin)
				continue;

			// break ties by last logged in
			if(topViewer == undefined || activityArr[0] > topViews || ( (activityArr[0] == topViews) && (user.lastLoggedIn > topViewer.lastLoggedIn))){
				topViews = activityArr[0];
				topViewer = user;
			}

			if(topRater == undefined  || activityArr[1] > topRatings || ( (activityArr[1] == topRatings) && (user.lastLoggedIn > topRater.lastLoggedIn))){
				topRatings = activityArr[1];
				topRater = user;
			}

			if(topCreator == undefined  || activityArr[2] > topCreations || ( (activityArr[2] == topCreations) && (user.lastLoggedIn > topCreator.lastLoggedIn))){
				topCreations = activityArr[2];
				topCreator = user;
			}

		}

		$scope.topViewer = topViewer;
		$scope.topRater = topRater;
		$scope.topCreator = topCreator;
		
		//----- Pagination
		$scope.itemsPerPage = 15;
		$scope.maxSize = 5; 
		$scope.currentPage = 1; 


		$scope.processName = function(name){
			if(name.length > 23)
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
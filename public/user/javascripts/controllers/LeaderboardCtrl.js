angular.module('studionet')

.controller('LeaderboardCtrl', ['$scope', 'users', function($scope, users){

		$scope.users = users.users;

		var topViews = 0, topViewer; 
		var topRatings = 0, topRater;  
		var topCreations = 0, topCreator; 
		for(var i=0; i < $scope.users.length; i++){

			var user = $scope.users[i];
			var activityArr = user.activityArr;

			// break ties by last logged in
			if(activityArr[0] > topViews){
				topViews = activityArr[0];
				topViewer = user;
			}

			if(activityArr[1] > topRatings){
				topRatings = activityArr[1];
				topRater = user;
			}

			if(activityArr[2] > topCreations){
				topCreations = activityArr[2];
				topCreator = user;
			}

		}

		$scope.topViewer = topViewer;
		$scope.topRater = topRater;
		$scope.topCreator = topCreator;

}]);
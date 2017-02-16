angular.module('studionet')

.controller('ProfileController', ['$scope', 'profile', 'tags', 'groups', 'users', 'GraphService', function($scope, profile, tags, groups, users, GraphService){


	/*
	 *	Functionality for User Profile Page
	 */
	$scope.tags = tags.tags;
	$scope.groups = groups.groups;

	$scope.tagline = "Beginner";

	// Observe the Graph Service for Changes and register observer
	var updateProfile;

	var computeStats = function(){

		$scope.views = 0; 
		$scope.rating = 0;
		// compute the rating based on rating of the contributions the user has made
		var rateCount = 0;
		var totalRating = 0;

		if($scope.user.contributions.length == 1 && $scope.user.contributions[0].title == null){
			$scope.user.contributions = [];
		}
		else{
			for(var i=0; i < $scope.user.contributions.length; i++){
				var contribution = $scope.user.contributions[i]; 
				$scope.views += contribution.views; 
				totalRating += contribution.rateCount*contribution.rating;
				rateCount += contribution.rateCount;  
			}
		}

		if($scope.user.tags.length == 1 && $scope.user.tags[0].name == null){
			$scope.user.tags = [];
		}


		$scope.rating = (totalRating / rateCount).toFixed(1);
		$scope.level = Math.floor($scope.user.level + 1)
	}

	$scope.goToNode = function(node_id){
		GraphService.selectNode(node_id);
		$scope.close();
	}


	$scope.setUser = function(user_id, own){

		$scope.own = own;

		if($scope.own){
			
			$scope.user = profile.user;

			if($scope.user.isGuest== true)
				return;

			updateProfile = function(){
			  $scope.user = profile.user;
			};
			profile.registerObserverCallback(updateProfile);
			
			computeStats();
		}
		else{

			var promise = {};
			$scope.user = users.getUser(user_id, false);
			users.getUser(user_id, true).then(function(res){

				if(res.status == 200){
					computeStats();
				}
				else{
					console.err("Error fetching user data");
				}


			});
		
		}
	
	}

	$scope.close = function() {
	    $('body').removeClass('modal-open');
	    $('.modal-backdrop').remove();
  	};
  

}])


/*
 * To edit the profile
 */
.controller('EditProfileCtrl', ['$scope', 'profile', 'Upload', '$http',  function($scope, profile, Upload, $http){

	$scope.init = function(){
		$scope.userData = { 'id': profile.user.id, 'name': profile.user.name, 'nusOpenId': profile.user.nusOpenId, 'avatar': profile.user.avatar, 'nickname' : profile.user.nickname };
	}

	$scope.uplodateFiles = function (profile_picture){

	  //$scope.userData.profilePic = profile_picture;

	  //console.log(profile_picture);
	  profile_picture = profile_picture[0];
	  $scope.profilePic = profile_picture;

	  
	  var reader  = new FileReader();
	  reader.addEventListener("load", function () {
	    $scope.userData.avatar = reader.result;
	  }, false);

	  if(profile_picture){
	  	reader.readAsDataURL(profile_picture);
	  }
  	
  	}

	$scope.uploadPic = function(avatar) {

		var formData = new FormData();
		formData.append('avatar', avatar, avatar.name);

	    $http({
				method  : 'POST',
				url     : '/uploads/avatar',
				headers : { 'Content-Type': undefined, 'enctype':'multipart/form-data; charset=utf-8' },
				processData: false,
				data: formData
	    })
	    .success(function(res) {
	    	
			profile.getUser().then(function(){
			  $scope.user.avatar = $scope.user.avatar + "?cb=" + Math.random(0,1)*123124;
			  $scope.init();
			});

	    });

   	}

   	$scope.updateProfile = function(){

   		// check if profile changed
   		if($scope.profilePic !== undefined){
   			// call function to update picture
	   		$scope.uploadPic($scope.profilePic);
   		}
   		else{
   			console.log("Avatar unchanged");
   		}		

   		// check if name changed
   		if($scope.userData.nickname == profile.user.nickname){
   			console.log("Same nickname - no need to update");
   		}
 		else{

 			if($scope.userData.nickname.replace(/\s/g, '').length || $scope.userData.nickname == ""){
	 			profile.changeName( {'id' : $scope.userData.id, 'nickname': $scope.userData.nickname } ).success(function(data){
	 				profile.getUser().then(function(){
	 					$scope.init();
	 				});
	 			});
 			}
 			else{
 				alert("Nickname can't contain only spaces.")
 			}

 		}
 
   	}

}]);


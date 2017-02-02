angular.module('studionet')

.controller('ProfileCtrl', ['$scope', 'ModalService', 'profile', 'tags', 'groups', function($scope, ModalService, profile, tags, groups){

	/*
	 *	Functionality for User Profile Page
	 */
	$scope.tags = tags.tags;

	// warning: be wary of scope overlaps; wasn't working with $scope.groups
	$scope.user = profile.user;
	$scope.lastLoggedIn = new Date($scope.user.lastLoggedIn);
	$scope.groups = groups.groups;

	$scope.tagline = "Beginner";

	// Observe the Graph Service for Changes and register observer
	var updateProfile = function(){
	  $scope.user = profile.user;
	};
	profile.registerObserverCallback(updateProfile);


	$scope.computeStats = function(){

		$scope.views = 0; 
		$scope.rating = 0;
		$scope.level = 0;

		var viewed = 0; 
		var rated = 0;
		var created = 0;

		// compute the rating
		var rateCount = 0;
		for(var i=0; i < $scope.user.contributions.length; i++){
			var contribution = $scope.user.contributions[i];
			$scope.views += contribution.views; 
			$scope.rating += contribution.rating;
			rateCount += contribution.rateCount;  
		}
		$scope.rating = ($scope.rating / rateCount).toFixed(1);

		// compute the level
		profile.getActivity().then(function(res){

			var data = res.data[0];
			data.map(function(activity){

				if(activity.type == "CREATED")
					$scope.level += 0.2;
				else if(activity.type == "RATED")
					$scope.level += 0.1;
				else if(activity.type == "VIEWED")
					$scope.level += 0.01;

			})

			$scope.level = $scope.level.toFixed(0);



		})

	}

	$scope.close = function() {
	    $('body').removeClass('modal-open');
	    $('.modal-backdrop').remove();
  	};
  

}])

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


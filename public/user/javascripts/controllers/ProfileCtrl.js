angular.module('studionet')

.controller('ProfileCtrl', ['$scope', 'ModalService', 'profile', 'contributions', 'tags', 'groups', function($scope, ModalService, profile, contributions, tags, groups){

	/*
	 *	Functionality for User Profile Page
	 */
	$scope.contributionsRef = contributions.contributions.hash();
	$scope.tags = tags.tags;

	// warning: be wary of scope overlaps; wasn't working with $scope.groups
	$scope.user = profile.user;
	$scope.lastLoggedIn = new Date($scope.user.lastLoggedIn);
	$scope.contributions = $scope.user.contributions;
	$scope.groups = groups.groups;

	// Observe the Graph Service for Changes and register observer
	var updateProfile = function(){
	  $scope.user = profile.user;
	};
	profile.registerObserverCallback(updateProfile);


	$scope.computeStats = function(){

		$scope.views = 0; 
		$scope.rating = 0;
		$scope.level = 0;

		var rateCount = 0;
		for(var i=0; i < $scope.contributions.length; i++){
			$scope.views += $scope.contributions[i].views; 
			$scope.rating += $scope.contributions[i].rating;
			rateCount += $scope.contributions[i].rateCount;  
		}

		$scope.rating = ($scope.rating / rateCount).toFixed(1);

		$scope.level = 0;

		profile.getContributions().then(function(res){

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
		$scope.userData = { 'id': profile.user.id, 'name': profile.user.name, 'nusOpenId': profile.user.nusOpenId, 'avatar': profile.user.avatar };
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
   		if($scope.userData.name == profile.user.name){
   			console.log("Same name - no need to update");
   		}
 		else{

 			console.log("Name changed - updating...")
 			profile.changeName( {'id' : $scope.userData.id, 'name': $scope.userData.name } ).success(function(data){
 				profile.getUser().then(function(){
 					//$scope.userData = { 'id': profile.user.id, 'name': profile.user.name, 'nusOpenId': profile.user.nusOpenId, 'avatar': profile.user.avatar };
 					$scope.init();
 				});
 			});

 		}
 
   	}

}]);

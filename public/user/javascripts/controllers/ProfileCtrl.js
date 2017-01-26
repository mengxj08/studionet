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

	$scope.userData = { 'id': profile.user.id, 'name': profile.user.name, 'nusOpenId': profile.user.nusOpenId, 'avatar': profile.user.avatar };

	$scope.uplodateFiles = function (profile_picture){

	  //$scope.userData.profilePic = profile_picture;

	  //console.log(profile_picture);
	  $scope.profilePic = profile_picture;
  	
  	}

	$scope.uploadPic = function(avatar) {

		var formData = new FormData();
		formData.append('avatar', avatar, avatar.name);

		console.log(formData);

	    $http({
				method  : 'POST',
				url     : '/uploads/avatar',
				headers : { 'Content-Type': undefined, 'enctype':'multipart/form-data; charset=utf-8' },
				processData: false,
				data: formData
	    })
	    .success(function(res) {
	    	
	    	console.log(res);

	    });

	    /*avatar.upload = Upload.upload({
	      url: '/uploads/avatar',
	      data: {avatar: avatar},
	    });*/


	    /*avatar.upload.then(function (response) {

	      $timeout(function () {
	        avatar.result = response.data;

	         // force a reload for avatar
		      var random = (new Date()).toString();
		      profile.getUser().then(function(){
			      $scope.user.avatar = $scope.user.avatar + "?cb=" + random;
			    });
	      });

	    }, function (response) {
	      
	      if (response.status > 0)
	        $scope.errorMsg = response.status + ': ' + response.data;
	    
	    }, function (evt) {
	    
	      	// Math.min is to fix IE which reports 200% sometimes
	      	avatar.progress = Math.min(100, parseInt(100.0 * evt.loaded / evt.total));
	    
	    });*/

   	}

   	$scope.updateProfile = function(){

   		// check if profile changed
   		if($scope.profilePic !== undefined){
   			// call function to update picture
	   		$scope.uploadPic($scope.profilePic[0]);
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
 			profile.changeName($scope.userData).success(function(data){
 				profile.getUser().then(function(){
 					$scope.userData = { 'id': profile.user.id, 'name': profile.user.name, 'nusOpenId': profile.user.nusOpenId, 'avatar': profile.user.avatar };
 				});
 			});

 		}
 
   	}

}]);

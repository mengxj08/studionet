angular.module('studionet')

.controller('ProfileCtrl', ['$scope', 'profile', '$http', function($scope, profile, $http){

	/*
	 *	Functionality for User Profile Page
	 */
	$scope.user = profile.user;
	$scope.groups = profile.groups;
	$scope.contributions = $scope.user.contributions;
	$scope.tags = $scope.user.tags;

	$scope.lastLoggedIn = new Date($scope.user.lastLoggedIn);

	$scope.close = function() {
	    $('body').removeClass('modal-open');
	    $('.modal-backdrop').remove();
  	};
  	
  
	$scope.isAdmin = profile.groups.reduce(function(res, curr){
		return res || curr.role==='Admin';
	}, false); 
	
	$scope.uploadPic = function(avatar) {
	    avatar.upload = Upload.upload({
	      url: '/uploads/avatar',
	      data: {username: $scope.username, avatar: avatar},
	    });

	    avatar.upload.then(function (response) {
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
	    });
   	}

  	$scope.uploadModel = function(model){
	    model.upload = Upload.upload({
	      url: '/uploads/models',
	      data: {username: $scope.username, model: model},
	    });

    	model.upload.then(function (response) {
		      $timeout(function () {
		        model.result = response.data;
		      });
		    }, function (response) {
		      if (response.status > 0)
		        $scope.errorMsg = response.status + ': ' + response.data;
		    }, function (evt) {
		      // Math.min is to fix IE which reports 200% sometimes
		      model.progress = Math.min(100, parseInt(100.0 * evt.loaded / evt.total));
		    });
  	};

  	$scope.changeName = function($event){
  		if($event.keyCode==13){
  			profile.changeName($scope.user);
  		}
  	}

  	$scope.showContribution = function(contribution_id){
  		alert("Hello from " , contribution_id);
  	}
	  




}])
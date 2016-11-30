angular.module('studionet')

.controller('DetailsModalCtrl', ['$scope', '$http', 'profile',  function($scope, $http, profile){
	// $scope.name = "Jane Doe";
  // $scope.age = 12;
  
  $scope.data = [];
  $scope.tags = [];

  $scope.refresh = function(){
      $http.get('/api/tags/').success(function(data){
			  $scope.tags = data;
        console.log('refreshing tages');
	    });
  }

  $scope.setData = function(data){
      $scope.data = data;
      console.log('Data output from DetailsModalCtrl');
      console.log(data);
  }
  
  //  This close function doesn't need to use jQuery or bootstrap, because
  //  the button has the 'data-dismiss' attribute.
  $scope.close = function() {
 	  
    close({
      name: $scope.user,
      age: $scope.modules
    }, 500); // close, but give 500ms for bootstrap to animate

    //$element.modal('hide');
    $('body').removeClass('modal-open');
    $('.modal-backdrop').remove();
  };

  //  This cancel function must use the bootstrap, 'modal' function because
  //  the doesn't have the 'data-dismiss' attribute.
  $scope.cancel = function() {

    //  Manually hide the modal.
    //$element.modal('hide');
    // $('body').removeClass('modal-open');
    // $('.modal-backdrop').remove();
    
    //  Now call close, returning control to the caller.
    close({
      name: $scope.user,
      age: $scope.modules
    }, 500); // close, but give 500ms for bootstrap to animate
  
  };

  $scope.createContribution = function(createContribution){
    console.log(profile.user);
    createContribution.author = profile.user.id;
    console.log(createContribution);
    $http({
      method  : 'POST',
      url     : '/api/contributions/',
      data    : createContribution,  // pass in data as strings
      headers : { 'Content-Type': 'application/json' }  // set the headers so angular passing info as form data (not request payload)
      })
    .success(function(data) {
      alert("Contribution Created");  
      $scope.refresh();  
    })
   };

  $scope.refresh();
}]);
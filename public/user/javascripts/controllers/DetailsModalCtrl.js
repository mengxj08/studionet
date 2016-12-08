angular.module('studionet')

.controller('DetailsModalCtrl', ['$scope', '$http', 'profile', 'users',  function($scope, $http, profile, users){
	// $scope.name = "Jane Doe";
  // $scope.age = 12;
  
  $scope.data = [];
  $scope.tags = [];
  $scope.relationships= [];

  $scope.users = users.usersById();

  $scope.refresh = function(){
      $http.get('/api/tags/').success(function(data){
			  $scope.tags = data;
        console.log('refreshing tages');
	    });

      $http.get('/api/relationships/').success(function(data){
			  $scope.relationships = data;
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

    //createContribution.author = profile.user.id;
    console.log(createContribution.ref);
    createContribution.refType = "RELATED_TO";
    
    $http({
      method  : 'POST',
      url     : '/api/contributions/',
      data    : createContribution,  // pass in data as strings
      headers : { 'Content-Type': 'application/json' }  // set the headers so angular passing info as form data (not request payload)
      })
    .success(function(data) {
        alert("Contribution Created");  
        $scope.refresh(); 

        refreshGraph();

    }) 
   };

  $scope.deleteContribution = function(contributionId){

    $http({
      method  : 'delete',
      url     : '/api/contributions/'+contributionId,
      data    : {},  // pass in data as strings
      headers : { 'Content-Type': 'application/json' }  // set the headers so angular passing info as form data (not request payload)
      })
    .success(function(data) {
      alert("Contribution id:" + contributionId + " deleted");  
      $scope.refresh();  
    })
  }

  $scope.updateContribution = function(){

  }
  
  $scope.refresh();
}]);
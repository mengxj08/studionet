angular.module('studionet')
.controller('CreateContributionCtrl', ['$scope', '$http', 'profile', 'users', 'supernode', function($scope, $http, profile, users, supernode){
  //$scope.user = profile.user;

  //$scope.data = [];
  $scope.tags = [];
  $scope.relationships= [];
  //$scope.users = users.usersById();

  $scope.refresh = function(){
      $http.get('/api/tags/').success(function(data){
			  $scope.tags = data;
        //console.log('refreshing tages');
	    });

      $http.get('/api/relationships/').success(function(data){
			  $scope.relationships = data;
		  });	
  }

  // $scope.setData = function(data, clickedContributionId){
  //     $scope.data = data;
  //     $scope.clickedContributionId = clickedContributionId;
  //     console.log('Data output from DetailsModalCtrl');
  //     console.log(data);
  // }
  
  //  This close function doesn't need to use jQuery or bootstrap, because
  //  the button has the 'data-dismiss' attribute.
  $scope.close = function() {
    $('body').removeClass('modal-open');
    $('.modal-backdrop').remove();
  };

  $scope.createContribution = function(createContribution){

    //createContribution.author = profile.user.id;
    if(!createContribution) return;

    createContribution.ref = supernode.contribution;
    createContribution.contentType = 'TEXT';
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
      $scope.close();
      //$scope.refresh(); 
      $scope.$parent.graphInit();
    })
    .error(function(error){
      alert("Error Msg:" + error.message); 
      $scope.close();
    })
   };
   
  $scope.refresh();

}]);
angular.module('studionet')
.controller('DetailsModalCtrl', ['$scope', '$http', 'profile', 'users', '$location', '$anchorScroll', function($scope, $http, profile, users, $location, $anchorScroll){
  $scope.user = profile.user;

  $scope.clickedContributionId = null;
  $scope.data = [];
  $scope.tags = [];
  $scope.relationships= [];

  $scope.users = users.usersById();

  $scope.refresh = function(){
      $http.get('/api/tags/').success(function(data){
			  $scope.tags = data;
        //console.log('refreshing tages');
	    });

      $http.get('/api/relationships/').success(function(data){
			  $scope.relationships = data;
		  });	
  }

  $scope.setData = function(data, clickedContributionId){
      $scope.data = data;
      $scope.clickedContributionId = clickedContributionId;
      console.log('Data output from DetailsModalCtrl');
      console.log(data);
  }
  
  //  This close function doesn't need to use jQuery or bootstrap, because
  //  the button has the 'data-dismiss' attribute.
  $scope.close = function() {
    console.log("Close the medal");
    //$('body').removeClass('modal-open');
    $(".modal").remove();
    $('.modal-backdrop').remove();
  };

  $scope.createContribution = function(createContribution){
    if(!createContribution) return;

    //createContribution.author = profile.user.id;
    console.log(createContribution.ref);
    createContribution.refType = "RELATED_TO";
    createContribution.contentType = 'TEXT';
    
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

  $scope.deleteContribution = function(contributionId){
    $http({
      method  : 'delete',
      url     : '/api/contributions/'+contributionId,
      data    : {},  // pass in data as strings
      headers : { 'Content-Type': 'application/json' }  // set the headers so angular passing info as form data (not request payload)
      })
    .success(function(data) {
      alert("Contribution id:" + contributionId + " deleted");
      $scope.close();
      //$scope.refresh();  
      $scope.$parent.graphInit();
    })
    .error(function(error){
      alert("Error Msg:" + error.message);
      $scope.close();
    })
  }

  $scope.updateContribution = function(updateContribution){
    console.log("This is output from update contribution");
    $http({
      method  : 'PUT',
      url     : '/api/contributions/'+ updateContribution.id,
      data    : updateContribution,  // pass in data as strings
      headers : { 'Content-Type': 'application/json' }  // set the headers so angular passing info as form data (not request payload)
      })
    .success(function(data) {
      alert("Contribution Updated");
      $scope.close();
      //$scope.refresh(); 
      $scope.$parent.graphInit();
    })
    .error(function(error){
      alert("Error Msg:" + error.message);
      $scope.close();
    })
  }

  $scope.submitContribution = function(showCreateContribution,showUpdateContribution,contributionData){
    if(showCreateContribution)
      $scope.createContribution(contributionData);

    if(showUpdateContribution)
      $scope.updateContribution(contributionData);
  }

  $scope.refresh();

  $scope.scrollTo = function (){
      // set the location.hash to the id of the element you wish to scroll to.
      $location.hash('modal' + $scope.clickedContributionId);

      // call $anchorScroll()
      $anchorScroll();
  };
}]);
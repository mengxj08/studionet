angular.module('studionet')
.controller('DetailsModalCtrl', ['$scope', '$http', 'profile', 'users', '$location', '$anchorScroll', 'contribution', function($scope, $http, profile, users, $location, $anchorScroll, contribution){
  $scope.user = profile.user;

  $scope.clickedContributionId = null;
  $scope.data = [];
  $scope.tags = [];
  $scope.relationships= [];
  $scope.contributions = [];

  $scope.users = users.usersById();

  /*
   * Rating-related Code
   */
  $scope.rate = 0;
  $scope.max = 5;
  $scope.overStar = null; 
  $scope.percent = 0;
  $scope.hoveringOver = function(value) {
    $scope.overStar = value;
    $scope.percent = 100 * (value / $scope.max);
  };
  $scope.rateContribution = function(rating, id){
     contribution.rateContribution(id, rating).then(function(){
        console.log("Contribution Rated Successfully");
    })
  }

  /*
   * General
   */
  $scope.refresh = function(){
      $http.get('/api/tags/').success(function(data){
			  $scope.tags = data;
	    });

      $http.get('/api/relationships/').success(function(data){
			  $scope.relationships = data;
		  });

      $http.get('/api/contributions/').success(function(data){
			  $scope.contributions = data;
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

      // increase viewcount for contribution
      console.log("Updating view count");
      contribution.updateViewCount($scope.clickedContributionId);


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

    console.log($scope.$parent.filterStatus);
    contribution.deleteContribution(contributionId).then(function(){

      if($scope.$parent.filterStatus){
        angular.element('#filterPanel').scope().filterRequest();  
      }
      else{
        $scope.$parent.graphInit();
      }

      $scope.close();

    }, function(error){
        
        alert("Error", error)
    
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

  $scope.createLink = function(linkData){
    linkData.createdBy = $scope.user.id;

    if(linkData.currentContributionType == 'source'){
      linkData.source = linkData.currentContributionId;
      linkData.target = linkData.linkedtoContributionId;
    }
    else{
      linkData.source = linkData.linkedtoContributionId;
      linkData.target = linkData.currentContributionId;
    }

    console.log(linkData);
    $http({
          method  : 'POST',
          url     : '/api/relationships/',
          data    : linkData,  
          headers : { 'Content-Type': 'application/json' }  // set the headers so angular passing info as form data (not request payload)
          })
        .success(function(data) {
          alert("Link Created");  
          $scope.close();
          //$scope.refresh(); 
          $scope.$parent.graphInit(); 
        })
        .error(function(error){
          alert("Error Msg:" + error.message);
          $scope.close();
        })
	}


  $scope.submitContribution = function(showCreateContribution,showLinkingContribution,showUpdateContribution,contributionData,linkData){
    if(showCreateContribution)
      $scope.createContribution(contributionData);

    if(showLinkingContribution)
      $scope.createLink(linkData);

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
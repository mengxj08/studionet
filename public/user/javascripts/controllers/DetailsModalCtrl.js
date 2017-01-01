angular.module('studionet')
.controller('DetailsModalCtrl', ['$scope', '$http', 'profile', 'users', '$location', '$anchorScroll', 'contribution', 'contributions', 'relationships', 'tags', function($scope, $http, profile, users, $location, $anchorScroll, contribution, contributions, relationships, tags){
  //initial
  if(relationships.relationships.length == 0)relationships.getAll();

  // contribution that was clicked
  $scope.activeContribution = null;

  // tree of the contribution clicked
  $scope.contributionTree = [];  

  // general 
  $scope.user = profile.user;
  $scope.tags = tags.tags;
  $scope.relationships = relationships.relationships;
  $scope.contributions = contributions.contributions;
  $scope.users = users.usersById();

  $scope.alert = {}; 
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
   * Attachments Code
   */
  $scope.getThumb = function(contributionId, attachment){
    if(attachment.thumb)
      return "/api/contributions/" + contributionId + /attachments/+ attachment.id + "/thumbnail";
    else
      return "http://placehold.it/200x200"; // replace with image for particular extension

  }

  /*
   * General
   */
  $scope.refresh = function(){
      tags.getAll();
      relationships.getAll();
      contributions.getAll();
  }

  $scope.loadTags = function($query){
      return $scope.tags.filter(function(tag){
        return tag.name.toLowerCase().search($query.toLowerCase()) != -1;
      });
  }

  // setting data from scope calling ModalService
  $scope.setData = function(data, activeContribution){
      $scope.contributionTree = data;
      $scope.activeContribution = activeContribution;
      console.log('Data output from DetailsModalCtrl');
      console.log(data);
  }
  
  $scope.getAllContributions = function(contributions){
      $scope.contributions = contributions;
  }

  //  This close function doesn't need to use jQuery or bootstrap, because
  //  the button has the 'data-dismiss' attribute.
  $scope.close = function() {

      // increase viewcount for contribution
      console.log("Updating view count");
      contribution.updateViewCount($scope.activeContribution);

      //$('body').removeClass('modal-open');
      $(".modal").remove();
      $('.modal-backdrop').remove();
    
  };

  $scope.createContribution = function(createContribution){
        if(!createContribution) return;

        createContribution._tags.map(function(t){
            createContribution.tags.push(t.name);
        });

        createContribution.contentType = 'TEXT';

        contribution.createContribution( createContribution).then(function(res){
              $scope.alert.success = true; 
              $scope.alert.successMsg = "Contribution Id : " + res.id + " has been created.";
              $scope.$parent.graphInit();
              $scope.refresh();

        }, function(error){
              $scope.alert.error = true; 
              $scope.alert.errorMsg = error;
        }); 

        // $http({
        //   method  : 'POST',
        //   url     : '/api/contributions/',
        //   data    : createContribution,  // pass in data as strings
        //   headers : { 'Content-Type': 'application/json' }  // set the headers so angular passing info as form data (not request payload)
        //   })
        // .success(function(res) {
        //   //alert("Contribution Created");
        //   //$scope.close();
        //   $scope.alert.success = true; 
        //   $scope.alert.successMsg = "Contribution Id : " + res.id + " has been created.";
        //   //$scope.alert.successId = res.data.id;
        //   $scope.$parent.graphInit();
        //   $scope.refresh();
        // })
        // .error(function(error){
        //   $scope.alert.error = true; 
        //   $scope.alert.errorMsg = error;
        // })
   };

  $scope.deleteContribution = function(contributionId){

      contribution.deleteContribution(contributionId).then(function(){

      if($scope.$parent.filterStatus){
        angular.element('#filterPanel').scope().filterRequest();  
      }
      else{
        $scope.$parent.graphInit();
      }

      $scope.refresh();

      }, function(error){
          alert("Error occured while deleting contribution")
      })
  }

  $scope.updateContribution = function(updateContribution){
    
    updateContribution.tags = [];
    updateContribution._tags.map(function(t){
      updateContribution.tags.push(t.name);
    });
    delete updateContribution._tags;
    
    console.log("This is output from update contribution", updateContribution);

    contribution.updateContribtuion(updateContribution).then(function(res){
          $scope.alert.success = true; 
          $scope.alert.successMsg = "Contribution Id : " + res.id + " has been updated.";
          $scope.$parent.graphInit();
          $scope.refresh();

    }, function(error){
          $scope.alert.error = true; 
          $scope.alert.errorMsg = error.data;
    }); 

    // $http({
    //   method  : 'PUT',
    //   url     : '/api/contributions/'+ updateContribution.id,
    //   data    : updateContribution,  // pass in data as strings
    //   headers : { 'Content-Type': 'application/json' }  // set the headers so angular passing info as form data (not request payload)
    //   })
    // .success(function(data) {
    //   alert("Contribution Updated");
    //   $scope.close();
    //   $scope.refresh();
    //   $scope.$parent.graphInit();
    // })
    // .error(function(error){
    //   alert("Error Msg:" + error.message);
    //   $scope.close();
    // })
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

  $scope.scrollTo = function (){
      // set the location.hash to the id of the element you wish to scroll to.
      $location.hash('modal' + $scope.activeContribution);

      // call $anchorScroll()
      $anchorScroll();
  };
}]);
angular.module('studionet')
.controller('DetailsModalCtrl', ['$scope', '$http', 'profile', 'users', '$location', '$anchorScroll', 'contribution', 'contributions', 'relationships', 'tags', function($scope, $http, profile, users, $location, $anchorScroll, contribution, contributions, relationships, tags){

  // general 
  $scope.user = profile.user;
  $scope.tags = tags.tags;
  $scope.relationships = relationships.relationships;
  $scope.contributions = contributions.contributions;
  $scope.users = users.users.hash();

  $scope.alert = {}; 
  
  // --- Modal Opening and Closing
  $scope.clickedContribution = null;
  $scope.contributionTree = [];  

  // setting data from scope calling ModalService
  $scope.setData = function(data, activeContribution){
      $scope.contributionTree = data; // contribution tree
      $scope.clickedContribution = activeContribution;  // contribution clicked initially
      $scope.activeContribution = activeContribution; // contribution currently in view (when scroll is implemented)
      console.log(data);
  }

  //  This close function doesn't need to use jQuery or bootstrap, because
  //  the button has the 'data-dismiss' attribute.
  $scope.close = function() {

      // increase viewcount for contribution
      console.log("Updating view count");
      contribution.updateViewCount($scope.activeContribution);

      $(".modal").remove();
      $('.modal-backdrop').remove();
    
  };

  // PlugIns Functionality

  // Tags
  $scope.loadTags =  function($query){
          return tags.tags.filter(function(tag){
            return tag.name.toLowerCase().search($query.toLowerCase()) != -1;
          });
  }

  //  Ratings
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

  // Attachments
  $scope.getThumb = function(contributionId, attachment){
    if(attachment.thumb)
      return "/api/contributions/" + contributionId + /attachments/+ attachment.id + "/thumbnail";
    else
      return "http://placehold.it/200x200"; // replace with image for particular extension

  }

  //Uploaded files
  $scope.uplodateFiles = function (file, contributionData){
        console.log('Testing');
        if(file){
              contributionData.attachments.push(file);
        }   
  }

  //remove files
  $scope.removeFiles = function (attachment, contributionData) {
        var index = contributionData.attachments.indexOf(attachment);
        if(index > -1){
              contributionData.attachments.splice(index, 1);
        }
  }

  // -------- Contribution Viewer Functionality (Read, Update, Delete)
  
  // REPLY - QUESTION, COMMENT, ANSWER, RESOURCE, RELATED_TO (generic) 
  // Should have different buttons for the above relationships instead of dropdown
  $scope.createContribution = function( createContribution ){

        if(!createContribution) return;

        createContribution.contentType = 'text'; /// default
        createContribution.tags = [];

        // if _tags is defined
        if(createContribution._tags)
            createContribution._tags.map(function(t){
                createContribution.tags.push(t.name.trim());
            });

        contribution.createContribution( createContribution ).then(function(res){
              $scope.alert.success = true; 
              $scope.alert.successMsg = "Contribution Id : " + res.data.id + " has been created.";
        }, function(error){
              $scope.alert.error = true; 
              $scope.alert.errorMsg = error;
        }); 
   };


  $scope.updateContribution = function(updateContribution){
    
    updateContribution.tags = [];
    updateContribution._tags.map(function(t){
      updateContribution.tags.push(t.name);
    });
    delete updateContribution._tags;
    
    //console.log("This is output from update contribution", updateContribution);

    contribution.updateContribtuion(updateContribution).then(function(res){
          
          $scope.alert.success = true; 
          $scope.alert.successMsg = "Contribution Id : " + updateContribution.id + " has been updated.";

    }, function(error){
          $scope.alert.error = true; 
          $scope.alert.errorMsg = error.data;
    }); 
  }


  // Delete the contribution
  $scope.deleteContribution = function(contributionId){

      contribution.deleteContribution(contributionId).then(function(){

      }, function(error){
          alert("Error occured while deleting contribution")
      })
  }


  // deprecated
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


  /*
   * Contribution Tree Related
   */
  $scope.scrollTo = function (){
      // set the location.hash to the id of the element you wish to scroll to.
      $location.hash('modal' + $scope.activeContribution);

      // call $anchorScroll()
      $anchorScroll();
  };


}]);
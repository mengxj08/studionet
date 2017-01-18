angular.module('studionet')
.controller('DetailsModalCtrl', ['$scope', '$http', 'profile', 'users', '$location', 'attachments', 'contribution', 'contributions', 'relationships', 'tags', function($scope, $http, profile, users, $location, attachments, contribution, contributions, relationships, tags){

  // general 
  $scope.user = profile.user;
  $scope.tags = tags.tags;
  $scope.relationships = relationships.relationships;
  $scope.contributions = contributions.contributions;
  $scope.users = users.users.hash();

  //shared parameters in different sub scopes
  $scope.showReplyModal = null; //show the replying modal
  $scope.contributionData = null; //store the data of replying information

  $scope.alert = {}; 
  
  // --- Modal Opening and Closing
  $scope.clickedContribution = null;
  $scope.contributionTree = [];  

  // --- Receive Broadcast and display the contribution 
  $scope.$on( BROADCAST_CONTRIBUTION_CLICKED, function(event, args) {
    console.log(args.data, args.clickedContributionId)
      $scope.setData(args.data, args.clickedContributionId);
  });

  // setting data from scope calling ModalService
  $scope.setData = function(data, activeContribution){
      
      $scope.contributionTree = data; // contribution tree
      $scope.clickedContribution = activeContribution;  // contribution clicked initially
      $scope.activeContribution = activeContribution; // contribution currently in view (when scroll is implemented)

      $scope.$apply();

      // open the modal
      // TODO: change to directive
      $('#detailsModal').modal('show');
  }

  //  This close function doesn't need to use jQuery or bootstrap, because
  //  the button has the 'data-dismiss' attribute.
  $scope.close = function() {

      $('body').removeClass('modal-open');
      $('.modal-backdrop').remove();

      console.log("View Contribution Modal Closed");

      // increase viewcount for contribution
      contribution.updateViewCount($scope.activeContribution);

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
  $scope.uploadFiles = function (files, contributionData){
      console.log(files.length + " file(s) have been choosen.");
      if(files){
          files.forEach(function(file){
                contributionData.attachments.push(file);
          });
      }   
  }

  //remove files
  $scope.removeFiles = function (attachment, contributionData) {
        var index = contributionData.attachments.indexOf(attachment);
        if(index > -1){
              contributionData.attachments.splice(index, 1);
        }
  }

  $scope.removeFilesAndfromDB = function (attachment, contributionData){
        attachments.deleteAttachmentbyId(attachment.id, contributionData.oldData.id)
          .then(function(res){
            var index = contributionData.attachments.indexOf(attachment);
            if(index > -1){
                  contributionData.attachments.splice(index, 1);
            }
          }, function(error){
            alert('[WARNING]: Deleting attachment is unsuccessful');
          })
  }
  // -------- Contribution Viewer Functionality (Read, Update, Delete)
  
  // REPLY - QUESTION, COMMENT, ANSWER, RESOURCE, RELATED_TO (generic) 
  // Should have different buttons for the above relationships instead of dropdown
  $scope.createContribution = function(createContribution){

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
    if(!updateContribution.title || !updateContribution.body){
      alert("Please input the title or content of the contribution!");
      return;
    }

    updateContribution.tags = [];
    updateContribution._tags.map(function(t){
      updateContribution.tags.push(t.name);
    });
    delete updateContribution._tags;
    
    //Assign other properties from oldContribution to the new updateContribtuion
    updateContribution.id = updateContribution.oldData.id;
    updateContribution.contentType = updateContribution.oldData.contentType;
    updateContribution.ref = updateContribution.oldData.ref;
    delete updateContribution.oldData;


    //Remove the attachments that have already existed in the database
    //Newly chosen attachment should not have the 'attachment' property
    for(var i = 0; i < updateContribution.attachments; i++){
      if(updateContribution.attachments[i].attachment){
        updateContribution.attachments.splice(i--, 1);
      }
    }

    console.log(updateContribution);
    contribution.updateContribtuion(updateContribution).then(function(res){
          console.log("success");
          $scope.alert.success = true; 
          $scope.alert.successMsg = "Contribution Id : " + updateContribution.id + " has been updated.";

    }, function(error){
          console.log("failure");
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

  $scope.submitContribution = function(showLinkingContribution,showUpdateContribution,contributionData,linkData){
    // if($scope.showReplyModal)
    //   $scope.createContribution(contributionData);

    if(showLinkingContribution)
      $scope.createLink(linkData);

    if(showUpdateContribution)
      $scope.updateContribution(contributionData);
  }

// Reply to an exising contribution
  $scope.resetConbutionData = function (targetedContribution){
    $scope.showReplyModal = true; 
    $scope.contributionData = {};
    $scope.contributionData.tags = [];
    $scope.contributionData.attachments = [];
    $scope.contributionData.ref = targetedContribution.db_data.id
  }

  $scope.replyingContribution = function (contributionData){
    $scope.createContribution(contributionData);
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
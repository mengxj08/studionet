angular.module('studionet')
.controller('DetailsModalCtrl', ['$scope', '$http', 'profile', 'users', '$location', 'attachments', 'contribution', 'contributions', 'relationships', 'tags', function($scope, $http, profile, users, $location, attachments, contribution, contributions, relationships, tags){

  // general 
  $scope.user = profile.user;
  $scope.tags = tags.tags;
  $scope.relationships = relationships.relationships;
  $scope.contributions = contributions.contributions;
  $scope.users = users.users.hash();
  

  //todo: check why promise doesn't always get resolved
  $scope.relationships = [{"src_type":"contribution","target_type":"contribution","name":"QUESTION_FOR"},
                          {"src_type":"contribution","target_type":"contribution","name":"SUBMISSION_FOR"},
                          {"src_type":"contribution","target_type":"contribution","name":"ANSWER_FOR"},
                          {"src_type":"contribution","target_type":"contribution","name":"COMMENT_FOR"},
                          {"src_type":"contribution","target_type":"contribution","name":"RESOURCE_FOR"},
                          {"src_type":"contribution","target_type":"contribution","name":"INSPIRED_FROM"},
                          {"src_type":"contribution","target_type":"contribution","name":"RELATED_TO"},
                          {"src_type":"user","target_type":"contribution","name":"LIKED","properties":[{"name":"count","type":0}]},
                          {"src_type":"user","target_type":"contribution","name":"VIEWED","properties":[{"name":"count","type":0},
                          {"name":"last_viewed","type":"2017-01-23T07:31:43.857Z"}]}];

  //shared parameters in different sub scopes
  $scope.alert = {}; 
  
  $scope.contributionData = { attachments: [], tags: []}; //store the data of replying information
  $scope.replyMode = false;
  $scope.updateMode = false;

  var spinner = new Spinner(STUDIONET.GRAPH.spinner);
  var target = document.getElementById('cy');

  var all_tags = [];
  for(var i=0; i<$scope.tags.length; i++){
    all_tags[$scope.tags[i].name] = $scope.tags[i];
  }

  // sends message to graph
  var sendMessage = function(message){
    $scope.$emit(BROADCAST_MESSAGE, message );
  }

  $scope.showReplyModal = function(id){
    $scope.replyMode = true;
  }

  $scope.showUpdateModal = function(id){
    
    $scope.updateMode = true;
    $scope.contributionData = jQuery.extend({}, $scope.contribution.db_data);

    if($scope.contributionData.attachments[0].id == null){
      $scope.contributionData.attachments = [];
    }

    if($scope.contributionData.tags instanceof Array){
        $scope.contributionData._tags = $scope.contributionData.tags.map(function(t){
            return all_tags[t];
        })
    }  
    else if($scope.contributionData.tags == null){
      $scope.contributionData._tags = [];
    }
    else{
      $scope.contributionData._tags = [ all_tags[$scope.contributionData.tags] ]
    }

    $scope.contributionData._attachments = $scope.contributionData.attachments;
    $scope.contributionData.attachments = [];


  }


  // --- Modal Opening and Closing
  /*  $scope.clickedContribution = null;
    $scope.contributionTree = [];  */

  getRating = function(contribution_id){

    var rating = 0;
    
    for(var i=0; i < profile.contributions[0].length; i++){

      var user_contribution = profile.contributions[0][i];
      if( user_contribution.type == "RATED" && user_contribution.end == contribution_id ){
        rating = user_contribution.properties.rating;
        break;
      }

    }

    return rating;


  }

  // setting data from scope calling ModalService
  $scope.setData = function(data, activeContribution){
      
      //$scope.contributionTree = data; // contribution tree
      //$scope.clickedContribution = activeContribution;  // contribution clicked initially
      //$scope.activeContribution = activeContribution; // contribution currently in view (when scroll is implemented)

      $scope.contribution = data[0];

      // get rating
      $scope.rate = getRating( $scope.contribution.id );

      // if tags are a single word, convert to array
      console.log("tags",  $scope.contribution.db_data.tags);

      if($scope.contribution.db_data.tags.length == 1 && $scope.contribution.db_data.tags[0] == "")
        $scope.contribution.db_data.tags = [];

      contribution.updateViewCount($scope.contribution.db_data.id);

  }

  $scope.cancel = function(){
      $scope.contributionData = { attachments: [], tags: []}; //store the data of replying information
      $scope.replyMode = false;
      $scope.updateMode = false;
  }

  //  This close function doesn't need to use jQuery or bootstrap, because
  //  the button has the 'data-dismiss' attribute.
  $scope.close = function() {

      $('body').removeClass('modal-open');
      $('.modal-backdrop').remove();

      console.log("View Contribution Modal Closed");
      $('#contributionViewModal').modal('hide');

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

        console.log($scope.contributionData);
        
        //$scope.contributionData.rateCount++; 
        //$scope.contributionData.rating += rating; 
        console.log("Contribution Rated Successfully");

        //$scope.$apply();
    
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
  $scope.uplodateFiles = function (files, contributionData){
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

  $scope.getFormattedTags = function(contribution_tags){

    var all_tags = [];
    tags.tags.map(function(t){
      all_tags[t.name] = t;
    });

    if(contribution_tags instanceof Array){
      return contribution_tags.map(function(t){

          if(all_tags[t] !== undefined)
            return all_tags[t];
          else
            console.warn("Contribution tag not available in database. Something is wrong.")
      })
    }
    else{
      return [ all_tags[contribution_tags] ]; 
    }

  }

  // -------- Contribution Viewer Functionality (Read, Update, Delete)
  
  // REPLY - QUESTION, COMMENT, ANSWER, RESOURCE, RELATED_TO (generic) 
  // Should have different buttons for the above relationships instead of dropdown
  $scope.replyToContribution = function(contributionData, parentId){

        if(!contributionData) return;

        if(contributionData.title == undefined || contributionData.title.length == 0 || contributionData.body == undefined || contributionData.body.length == 0){
          alert("Contribution must have a title and body!");
          return;
        }

        contributionData.ref = parentId;

        contributionData.contentType = 'text'; /// default
        contributionData.tags = [];

        console.log(contributionData);

        if(contributionData.attachments == undefined)
          contributionData.attachments = [];

        // if _tags is defined
        if(contributionData._tags)
            contributionData._tags.map(function(t){
                contributionData.tags.push(t.name.toLowerCase().trim());
            });

        spinner.spin(target);


        contribution.createContribution( contributionData ).then(function(res){
              
              //$scope.alert.success = true; 
              //$scope.alert.successMsg = "Contribution Id : " + res.data.id + " has been created.";
              spinner.stop();
              sendMessage( {status: 200, message: "Replied to contribution successfully" } );

              // change contribution
              //$scope.contribution = contributionData;
              //
              $scope.close();


              //$scope.replyMode = false; 
              //$scope.updateMode = false;


        }, function(error){

              //alert("Error replying to message. Please")
              spinner.stop();
              sendMessage( {status: 200, message: "Error replying to message. Please try again." } );
        }); 
   };

  $scope.updateContribution = function(updateContribution){

    updateContribution.contentType = 'text'; /// default

    if(!updateContribution.title || !updateContribution.body){
      alert("Please input the title or content of the contribution!");
      return;
    }

    updateContribution.tags = [];
    if(updateContribution._tags.length > 0)
      updateContribution._tags.map(function(t){
        updateContribution.tags.push(t.name.toLowerCase().trim());
      });
    //delete updateContribution._tags;

    //Remove the attachments that have already existed in the database
    //Newly chosen attachment should not have the 'attachment' property
    for(var i = 0; i < updateContribution.attachments; i++){
      if(updateContribution.attachments[i].attachment){
        updateContribution.attachments.splice(i--, 1);
      }
    }

    spinner.spin(target);
    contribution.updateContribution(updateContribution).then(function(res){
       

        spinner.stop();
        sendMessage( {status: 200, message: "Updated contribution successfully" } );
        $scope.close();

    }, function(error){

          spinner.stop();
          
          sendMessage( {status: 500, message: "Error updating contribution" } );
          $scope.close();
          //$scope.alert.error = true; 
          //$scope.alert.errorMsg = error.data;
    });
  }

  // Delete the contribution
  $scope.deleteContribution = function(contributionId){

    var r = confirm("Are you sure you want to delete your contribution? This action cannot be undone");
    if (r == true) {

      spinner.spin(target);
      contribution.deleteContribution(contributionId).then(function(){
          
          //$scope.alert.success = true; 
          //$scope.alert.successMsg = "Contribution Id : " + $scope.contribution.id + " was successfully deleted.";
          spinner.stop();
          sendMessage({status: 200, message: "Contribution Id : " + $scope.contribution.id + " was successfully deleted." });
          $scope.close();

      }, function(error){

          spinner.stop();
          
          sendMessage({status: 500, message: "Error deleting Contribution Id : " + $scope.contribution.id });
          $scope.close();
      
      });
    } else {
        x = "You pressed Cancel!";
    }
  }


}]);
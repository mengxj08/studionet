angular.module('studionet')
.controller('DetailsModalCtrl', ['$scope', '$http', '$anchorScroll', '$location', 'profile', 'users', 'attachments', 'contribution', 'tags', function($scope, $http, $anchorScroll, $location, profile, users, attachments, contribution, tags){

        //////// --------------  general declarations
        $scope.user = profile.user;
        $scope.tags = tags.tags;
        $scope.random = Math.random();   // to prevent caching of profile images

        $scope.contribution = undefined, $scope.author = undefined, $scope.rate = undefined;






        /////// --------------- communication with parent container
        var spinner = new Spinner(STUDIONET.GRAPH.spinner);
        var target = document.getElementById('cy');
        var sendMessage = function(message){
          $scope.$emit(BROADCAST_MESSAGE, message );
        }





        ////// ---- Modal related functions

        $scope.setData = function(data, activeContribution){
            $scope.contribution = data[0];
            $scope.rate = getRating( $scope.contribution.id );   // check if the user has already rated this contribution
            $scope.author = users.getUser( $scope.contribution.db_data.createdBy, false );  // get the author details
            contribution.updateViewCount($scope.contribution.db_data.id);    // update the viewcount of the contribution
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

            $scope.$emit(BROADCAST_VIEWMODE_OFF, {} );

        };






        //////------------------ Dealing with Ratings
        $scope.rate = 0;
        $scope.max = 5;
        $scope.overStar = null; 
        $scope.percent = 0;

        // gets rating if the user has previously rated the contribution
        var previouslyRated = true;
        var getRating = function(contribution_id){
          var rating = 0;
          for(var i=0; i < profile.activity.length; i++){

            var user_contribution = profile.activity[i];
            if( user_contribution.type == "RATED" && user_contribution.end == contribution_id ){
              rating = user_contribution.properties.rating;
              break;
            }

          }
          return rating;
        }

        $scope.hoveringOver = function(value) {
          $scope.overStar = value;
          $scope.percent = 100 * (value / $scope.max);
        };
        
        $scope.rateContribution = function(rating, id){

          contribution.rateContribution(id, rating).success(function(data){

              console.log($scope.contribution.db_data.ratingArray);

              // check if user had already rated the contribution, if yes, donot change rate count and change only existing array

          })
        
        
        }

        ////////-------------- Dealing with attachments
        $scope.getThumb = function(contributionId, attachment){
            if(attachment.thumb)
              return "/api/contributions/" + contributionId + /attachments/+ attachment.id + "/thumbnail";
            else{

              if(attachment.name.indexOf(".pdf") > -1)
                return "./img/file_pdf.jpeg"
              else if(attachment.name.indexOf(".doc") > -1)
                return "./img/file_doc.png"
              else
                return "./img/file_default.png"; // replace with image for particular extension
            }
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






        /////// ------------------------ Dealing with tags
        var all_tags = [];
        for(var i=0; i<$scope.tags.length; i++){
          all_tags[$scope.tags[i].name] = $scope.tags[i];
        }
        // Tags
        $scope.loadTags =  function($query){
                return tags.tags.filter(function(tag){
                  return tag.name.toLowerCase().search($query.toLowerCase()) != -1;
                });
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
                  console.warn("Node tag not available in database. Something is wrong.")
            })
          }
          else{
            return [ all_tags[contribution_tags] ]; 
          }

        }



        ////// -------- Additional components (Read, Update, Delete)

        $scope.contributionData = { attachments: [], tags: []}; //store the data of replying information
        

        //----------------- Function: - Reply 
        $scope.replyMode = false;
        $scope.showReplyModal = function(id){
            $scope.replyMode = true;
            

            // call $anchorScroll()
            /*$location.hash('reply-modal');
            $anchorScroll();*/
        }

        $scope.replyToContribution = function(contributionData, parentId){

              if(!contributionData) return;

              if(contributionData.title == undefined || contributionData.title.length == 0 || contributionData.body == undefined || contributionData.body.length == 0){
                alert("Node must have a title and body!");
                return;
              }

              contributionData.ref = parentId;

              contributionData.contentType = 'text'; /// default
              contributionData.tags = [];

              // default relationship type for everything
              contributionData.refType = 'RELATED_TO';


              if(contributionData.attachments == undefined)
                contributionData.attachments = [];

              // if _tags is defined
              if(contributionData._tags)
                  contributionData._tags.map(function(t){
                      contributionData.tags.push(t.name.toLowerCase().trim());
                  });

              spinner.spin(target);
              contribution.createContribution( contributionData ).then(function(res){
                    
                    spinner.stop();
                    sendMessage( {status: 200, message: "Successfully replied to node" } );
                    $scope.close();

              }, function(error){

                    spinner.stop();
                    sendMessage( {status: 200, message: "Error replying to node. Please try again." } );
                    $scope.close();
              }); 
        };

        //----------------- Function: - Update
        $scope.updateMode = false;
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

        $scope.updateContribution = function(updateContribution){

          updateContribution.contentType = 'text'; /// default

          if(!updateContribution.title || !updateContribution.body){
            alert("Please input the title or content of the node!");
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
              sendMessage( {status: 200, message: "Successfully updated node." } );
              $scope.close();

          }, function(error){

                spinner.stop();
                sendMessage( {status: 500, message: "Error updating node" } );
                $scope.close();
          });
        };


        // ------------------Function: - Delete
        $scope.deleteContribution = function(contributionId){

          var r = confirm("Are you sure you want to delete your node? This action cannot be undone.");
          if (r == true) {

            spinner.spin(target);
            contribution.deleteContribution(contributionId).then(function(){
                
                spinner.stop();
                sendMessage({status: 200, message: "Successfully deleted node." });
                $scope.close();

            }, function(error){

                spinner.stop();
                sendMessage({status: 500, message: "Error deleting node" });
                $scope.close();
            
            });
          } else {
              x = "You pressed Cancel!";
          }

          $scope.close();
        };


        // -----------------Function - Author Profile
        $scope.authorMode = false; 
        
        $scope.showAuthorModal = function(){
          $scope.authorMode = true;
        }

        $scope.hideAuthorModal = function(){
          $scope.authorMode = false;
        }



}]);
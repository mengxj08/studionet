angular.module('studionet')

.controller('NodeController', [ '$scope', '$http', '$anchorScroll', '$location', 
                                'profile', 'users', 'attachments', 'GraphService', 'tags', 
                                function($scope, $http, $anchorScroll, $location, profile, users, attachments, GraphService, tags){

        
        //////// --------------  general declarations
        $scope.user = profile.user;
        $scope.tags = tags.tags;
        $scope.random = Math.random();   // to prevent caching of profile images

        $scope.contribution = undefined, $scope.author = undefined, $scope.rate = undefined;
        $scope.usersHash = users.usersHash;



        /////// --------------- communication with parent container
        var target = document.getElementById('cy');
        var sendMessage = function(message){
          $scope.$emit(BROADCAST_MESSAGE, message );
        }


        var getReplies = function(){
          $scope.replies = [];
          GraphService.comments.nodes("[ref=" + $scope.contribution.id + "]").map(function(commentNode){
              GraphService.getNode(commentNode.id());
              $scope.replies.push(commentNode.data());
          })
        }


        ////// ---- Modal related functions
        $scope.setData = function(node){
            
            // will be used internally but the reply feature
            if( !(node instanceof Object )){
              node = GraphService.comments.getElementById(node).length ? GraphService.comments.getElementById(node) : GraphService.graph.getElementById(node);
              $scope.showComments = true;
            }

            GraphService.getNode( node );

            $scope.contribution = node.data();

            getReplies();

            $scope.rate = getRating( $scope.contribution.id );   // check if the user has already rated this contribution
            $scope.author = users.getUser( $scope.contribution.createdBy, false );  // get the author details
            GraphService.updateViewCount($scope.contribution.id);    // update the viewcount of the contribution
            node.addClass('read');
        }


        $scope.cancel = function(){
            $scope.contributionData = { attachments: [], tags: []}; //store the data of replying information
            $scope.replyMode = false;
            $scope.updateMode = false;
            $scope.commentMode = false;
        }


        //  This close function doesn't need to use jQuery or bootstrap, because
        //  the button has the 'data-dismiss' attribute.
        $scope.close = function() {

            $('body').removeClass('modal-open');
            $('.modal-backdrop').remove();

            $('#contributionViewModal').modal('hide');

            $scope.$emit(BROADCAST_VIEWMODE_OFF, {} );

        };



        //////------------------ Dealing with Ratings
        $scope.rate = 0;
        $scope.max = 5;
        $scope.overStar = null; 
        $scope.percent = 0;

        // gets rating if the user has previously rated the contribution
        var previouslyRated = 0;
        var getRating = function(contribution_id){
          var rating = 0;
          for(var i=0; i < profile.activity.length; i++){

            var user_contribution = profile.activity[i];
            if( user_contribution.type == "RATED" && user_contribution.end == contribution_id ){
              rating = user_contribution.properties.rating;
              break;
            }

          }
          previouslyRated = rating;
          return rating;
        }

        $scope.hoveringOver = function(value) {
          $scope.overStar = value;
          $scope.percent = 100 * (value / $scope.max);
        };
        
        $scope.rateContribution = function(rating, id){

          GraphService.rateNode(id, rating).success(function(data){

              // check if user had already rated this contribution
              if(previouslyRated==0){
                $scope.contribution.rateCount++;
                $scope.contribution.ratingArray[rating-5]++; console.log("here2")
              }
              else{

                $scope.contribution.ratingArray[5 - rating] = $scope.contribution.ratingArray[5 - rating] + 1; 
                $scope.contribution.ratingArray[5 - previouslyRated] = $scope.contribution.ratingArray[5 - previouslyRated] - 1; 
                previouslyRated = rating;

              }

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
        $scope.comment = "";
      
        //--------------- Function: - Comment
        $scope.commentMode = false;
        $scope.showCommentModal = function(){
          $scope.commentMode = true;
        }

        $scope.postComment = function(comment){
            if(!comment) return;

            var commentData = { attachments: [], tags: [] }

            commentData.title = "Re: " + $scope.contribution.title;
            commentData.body = comment;


            commentData.ref = $scope.contribution.id;

            commentData.contentType = 'comment'; /// default
            commentData.tags = [];

            // default relationship type for everything
            commentData.refType = 'COMMENT_FOR';

            $scope.commentMode = false;
            GraphService.createNode( commentData ).then(function(res){
                  
                  sendMessage( {status: 200, message: "Successfully commented on node" } );
                  getReplies();
                  $scope.showComments = true;

            }, function(error){

                  sendMessage( {status: 200, message: "Error commenting on node. Please try again." } );
                  $scope.close();
            }); 
        }


        //----------------- Function: - Reply 
        $scope.replyMode = false;
        $scope.showReplyModal = function(id, type){
          $scope.replyMode = true;
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

              GraphService.createNode( contributionData ).then(function(res){
                    
                    sendMessage( {status: 200, message: "Successfully replied to node" } );
                    $scope.close();

              }, function(error){

                    sendMessage( {status: 200, message: "Error replying to node. Please try again." } );
                    $scope.close();
              }); 
        };


        //----------------- Function: - Update
        $scope.updateMode = false;
        $scope.showUpdateModal = function(id){
          
              $scope.updateMode = true;
              $scope.contributionData = jQuery.extend({}, $scope.contribution);
              $scope.contributionData.contentType = $scope.contribution.type; 

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

          $scope.updateMode = false;
          GraphService.updateNode(updateContribution).then(function(res){
                sendMessage( {status: 200, message: "Successfully updated node." } );
          }, function(error){
                sendMessage( {status: 500, message: "Error updating node" } );
                $scope.close();
          });
        };


        // ------------------Function: - Delete
        $scope.deleteContribution = function(contributionId){

            GraphService.deleteNode(contributionId).then(function(){
                sendMessage({status: 200, message: "Successfully deleted node." });
                $scope.close();
            }, function(error){
                sendMessage({status: 500, message: "Error deleting node" });
                $scope.close();
            });

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
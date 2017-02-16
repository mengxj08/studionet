angular.module('studionet')

.controller('NewNodeController', ['$scope', 'supernode', 'GraphService', 'tags', function($scope, supernode, GraphService, tags){

      // for the new contribution
      $scope.contributionData = { _tags: [], attachments: [], tags: [], refType: "RELATED_TO", contentType: "text", ref: supernode.contribution};

      $scope.loadTags = function($query){
          return tags.tags.filter(function(tag){
            return tag.name.toLowerCase().search($query.toLowerCase()) != -1;
          });
      }

      //  This close function doesn't need to use jQuery or bootstrap, because
      //  the button has the 'data-dismiss' attribute.
      $scope.close = function() {

            $scope.contributionData = { _tags: [], attachments: [], tags: [], refType: "RELATED_TO", contentType: "text", ref: supernode.contribution};

            $('body').removeClass('modal-open');
            $('.modal-backdrop').remove();

            console.log("Create Contribution Modal Closed");

      };


      //Uploaded files
      $scope.uplodateFiles = function (files){
            console.log(files.length + "files have been choosen.");
            if(files){
                  files.forEach(function(file){
                        $scope.contributionData.attachments.push(file);
                  });
            }   
      }
      
      //remove files
      $scope.removeFiles = function (attachment) {
            var index = $scope.contributionData.attachments.indexOf(attachment);
            if(index > -1){
                  $scope.contributionData.attachments.splice(index, 1);
            }
      }

      $scope.createContribution = function(){
          if($scope.contributionData._tags.length > 0)
            $scope.contributionData._tags.map(function(t){
                $scope.contributionData.tags.push(t.name.toLowerCase().trim());
            });
          delete $scope.contributionData._tags;

          GraphService.createNode( $scope.contributionData ).then(function(res){
                $scope.$emit( BROADCAST_MESSAGE, { status: 200, message: "Node was created successfully." } );
                $scope.contributionData = { _tags: [], attachments: [], tags: [], refType: "RELATED_TO", contentType: "text", ref: supernode.contribution};
          }, function(error){
                $scope.$emit( BROADCAST_MESSAGE, { status: 500, message: "Error creating node." } );
          }); 

      };
   
}]);


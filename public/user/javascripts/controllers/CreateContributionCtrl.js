angular.module('contributionEditorDirective', [])
.controller('CreateContributionCtrl', ['$scope', 'supernode', 'contribution', 'tags', function($scope, supernode, contribution, tags){

      $scope.alert = {}; 

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
          $scope.contributionData._tags.map(function(t){
              $scope.contributionData.tags.push(t.name.trim());
          });
          delete $scope.contributionData._tags;

          contribution.createContribution( $scope.contributionData ).then(function(res){
                $scope.alert.success = true; 
                $scope.alert.successMsg = "Your contribution was created." // res.data.id; 
                $scope.alert.successId = res.data.id;

          }, function(error){
                $scope.alert.error = true; 
                $scope.alert.errorMsg = error;
          }); 

      };
   
}]);


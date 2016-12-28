angular.module('studionet')
.controller('CreateContributionCtrl', ['$scope', 'supernode', 'contribution', function($scope, supernode, contribution){

      var all_tags = $scope.$parent.tags; 
      $scope.file;

      $scope.alert = {}; 


      $scope.loadTags = function($query){
          return all_tags.filter(function(tag){
            return tag.name.toLowerCase().search($query.toLowerCase()) != -1;
          });
      }

      //  This close function doesn't need to use jQuery or bootstrap, because
      //  the button has the 'data-dismiss' attribute.
      $scope.close = function() {

            $('body').removeClass('modal-open');
            $('.modal-backdrop').remove();

            console.log($scope.alert.successId);
            //$scope.$parent.highlightNode( null, $scope.alert.successId );

      };

            // for the new contribution
      $scope.contributionData = { _tags: [], _files: [], attachments: [], tags: [], refType: "RELATED_TO", contentType: "text", ref: supernode.contribution};
      $scope.createContribution = function(){

          $scope.contributionData._tags.map(function(t){
             $scope.contributionData.tags.push(t.name);
          });

          $scope.contributionData._files.map(function(file){
             $scope.contributionData.attachments.push(fileReader.result);
          });
          
          delete $scope.contributionData._tags;
          delete $scope.contributionData._files;

          contribution.createContribution( $scope.contributionData ).then(function(res){
                $scope.alert.success = true; 
                $scope.alert.successMsg = "Contribution Id : " + res.data.id; 
                $scope.alert.successId = res.data.id;
                
                $scope.$parent.graphInit();

          }, function(error){
                $scope.alert.error = true; 
                $scope.alert.errorMsg = error;
          }); 

       };
   
}]);
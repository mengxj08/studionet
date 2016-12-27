angular.module('studionet')
.controller('CreateContributionCtrl', ['$scope', 'supernode', 'contribution', function($scope, supernode, contribution){

      var all_tags = $scope.$parent.tags; 

      $scope.alert = {}; 


      // for the new contribution
      $scope.contributionData = { tags: [], refType: "RELATED_TO", contentType: "text", ref: supernode.contribution};

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
      };

      $scope.createContribution = function(){
          $scope.contributionData.s_tags.map(function(t){
             $scope.contributionData.tags.push(t.name);
          })
          
          contribution.createContribution( $scope.contributionData ).then(function(res){
                $scope.alert.success = true; 
                $scope.alert.successMsg = "Contribution Id : " + res.data.id; 
          }, function(error){
                $scope.alert.error = true; 
                $scope.alert.errorMsg = error;
          });
       };
   
}]);
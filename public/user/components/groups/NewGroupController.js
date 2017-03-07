angular.module('studionet')

.controller('NewGroupController', ['$scope', 'supernode', 'GraphService', 'users', 'groups', function($scope, supernode, GraphService, users, groups){

      // for the new contribution

      var refresh = function(){
        $scope.groupData = { name: "", description: "", users: [] };
      };

      refresh();


      //  This close function doesn't need to use jQuery or bootstrap, because
      //  the button has the 'data-dismiss' attribute.
      $scope.close = function() {
            refresh();
            $scope.$emit('close_group_creation');
      };

      $scope.createGroup = function(){

          // add users
          $scope.users.map(function(u){
              if(u.member)
                $scope.groupData.users.push(u.id);
          })
          
          groups.createGroup( $scope.groupData ).then(function(res){

                refresh();
                $scope.$emit( BROADCAST_MESSAGE, { status: 200, message: "Group was created successfully." } );
                $scope.$emit('close_group_creation');
          
          }, function(error){

                $scope.$emit( BROADCAST_MESSAGE, { status: 500, message: "Error creating group." } );
                $scope.$emit('close_group_creation');
          
          }); 

      };

      // user list
      $scope.sortType     = 'name'; // set the default sort type
      $scope.sortReverse  = true;  // set the default sort order
      $scope.searchUser   = '';     // set the default search/filter term

      $scope.users = angular.copy(users.users);

      //----- Pagination
      $scope.itemsPerPage = 15;
      $scope.maxSize = 5; 
      $scope.currentPage = 1; 

   
}]);


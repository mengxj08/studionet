angular.module('studionet')

.controller('HomeCtrl', ['$scope', 'profile', 'Upload', '$timeout', 'modelsFactory', 'ModalService', '$http', 

 function($scope, profile, Upload, $timeout, modelsFactory, ModalService, $http){

	$scope.user = profile.user;
	$scope.modules = profile.modules;
  $scope.userModels = modelsFactory.userModels;
  
	$scope.isAdmin = profile.modules.reduce(function(res, curr){
		return res || curr.role==='Admin';
	}, false); 

  /*
   *
   *  Search Functionality
   * 
   */
  $scope.textFilter = "";
  $scope.searchActive = false;

  $scope.textSearchFilter = function(searchText){

      if(searchText ==  "")
        return; 

      cy.nodes().forEach(function( ele ){
          
          if( (ele.data().name).toLowerCase().includes( searchText.toLowerCase() )){
            console.log( ele.data().name );
            ele.addClass('searched');
            ele.connectedEdges().addClass('highlighted');
            $scope.searchActive = true;
          }
         
      });
  }

  $scope.clearSearch = function(){
    $scope.textFilter = "";
    $scope.searchActive = false;
    cy.elements().removeClass('highlighted')
    cy.elements().removeClass('searched')
  }

  /*
   *  List of all users
   * 
   */
  $scope.users = {};
  $http.get('/api/users/').success(function(user_data){

      user_data.map( function(u){
          $scope.users[ u.id ] = u;
      })

  });


  /*
   *
   *  Contribution Details
   *
   * 
   */


  $scope.showDetailsModal = function(data) {

      ModalService.showModal({
        templateUrl: "/user/templates/home.graphView.modal.html",
        controller: "DetailsModalCtrl",
        inputs: {
          title: "A More Complex Example"
        }
      }).then(function(modal) {
        modal.element.modal({
          backdrop: 'static'
          // keyboard: false
        });

        /// set data
        modal.scope.setData(data);

/*        modal.close.then(function(result) {
          //$scope.complexResult  = "Name: " + result.name + ", age: " + result.age;
        });*/
        
      });

    };

}])



/*
 * Controller for Filters
 */
.controller('FilterCtrl', ['$scope', '$http', 

   function($scope, $http){ 

      // Lists populating filters
      $scope.tags = [];
      $scope.authors = [];
      
      // Items selected in filters
      $scope.selectedAuthors = [];
      $scope.selectedTags = [1, 2, 3];
      $scope.firstDate = new Date();
      $scope.lastDate = new Date(); 
      $scope.firstDate.setDate($scope.firstDate.getDate() - 10);
      $scope.ratingMin = 3;
      $scope.ratingMax = 4;
      $scope.depthVal = 1;


      /*
       *  Composes FilterURL to send to server & modifies graph
       *  d, g, r, u, t , tg
       * 
       */
      $scope.filterRequest = function(data){

          var urlString = '/api/contributions?'; 
          
          //  Create the URL String
        
          urlString +=  "g=[" + $scope.selectedAuthors.filter( function(g){ return (g.type == "group") }).map( function(u){ return u.id } ).toString() + "]"   // users

          + "&u=[" + $scope.selectedAuthors.filter( function(g){ return (g.type == "user") }).map( function(u){ return u.id } ).toString() + "]"   // users

          + "&tg=[" + $scope.selectedTags.map( function(g){
             return g.id; 
          }).toString() + "]"    // tags

          + "&r=[" + $scope.ratingMin + "," + $scope.ratingMax + "]"    // rating

          + "&t=[" + $scope.firstDate.getTime() + "," + $scope.lastDate.getTime() + "]"   // time

          + "&d=" + $scope.depthVal;   // depth

          console.log(urlString);

          $http.get(urlString).success(function(data){
              
              console.log(urlString);
              console.log("results", data);
              refreshGraph(data);

          });

      };

      $scope.toggle = function( array ){

          if($scope["selected" + array].length == 0){
              $scope["selected" + array] = $scope[array.toLowerCase()];
          }
          else{
              $scope["selected" + array] = [];
          }

      }

      $scope.CustomCallback = function (item, selectedItems) {
          if (selectedItems !== undefined && selectedItems.length >= 80) {
              return false;
          } else {
              return true;
          }
      };

      /*
       * Initialization of filter-headings toggle functionality
       * TODO: find better fix
       */
      $scope.init = function(){

        $(".filter-heading").click(function(){
              $(this).siblings().toggle();
        });

        refresh();

      }

      /*
       *  Refresh function that refreshes all lists
       *  TODO: make these requests a service?
       *  
       */
      function refresh(){

          /*
           * Get list of tags to populate tags filter
           */
          $http.get('/api/tags/').success(function(tag_data){

              $scope.tags = tag_data.map( function(tag){

                  // add properties required for tree-view plugin
                  tag.parentId = null;
                  tag.isExpanded = false; 
                  tag.children = [];
                  
                  // default 
                  tag.selected = true;

                  return tag;

              });

              // set default value for filter - all tags
              //$scope.selectedTags =  $scope.tags;
              // console.log($rootScope.selectedTags, "tags");

          });
            
          /*
           *  Get groups to populate By Author Filter
           * 
           */
          $http.get('/api/groups/').success(function(group_data){

            /*
             * Groups preprocessing
             */

            var group_hash = {}; 

            // create hash for group_data
            for(var i=0; i < group_data.length; i++){
              
                group_data[i].children = [];
                group_data[i].type = "group";

                // default
                // group_data[i].selected = true;

                group_hash[ group_data[i].id ] = group_data[i];

            }

            // if group has parentId, add group to that parent's children array
            for(var i=0; i < group_data.length; i++){

              var group = group_data[i];

              if(group.parentId){

                  var parentGroup = group_hash[ group.parentId ];
                  parentGroup.children.push( group ); 

              }

            }

            // append authors to final array - only those at highest level
            $scope.authors = $scope.authors.concat( group_data.filter( function(group){
                  
                  // only highest level groups
                  group.isExpanded = false; 

                  return (group.parentId == null)

            }) );
              
          }); 


          /*
           *  Get users to populate By Author filter
           */
          $http.get('/api/users/').success(function(user_data){


              $scope.authors = $scope.authors.concat( user_data.map( function(user){

                  user.parentId = null; 
                  user.isExpanded = false; 
                  user.children = [];
                  user.type = "user";

                  // default - select self
                  if(user.id == $scope.user.id)
                    user.selected = true; 

                  return user;

              }) );

          });

      }



}]);
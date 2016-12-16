angular.module('studionet')

/*
 * Controller for Filters
 */
.controller('FilterCtrl', ['$scope', '$http', 'users', 'tags', 'groups',   function($scope, $http, users, tags, groups){ 

      $scope.filterStatus = false;
      $scope.filterChanged = false;


      // Lists populating filters
      $scope.tags = [];
      $scope.authors = [];
      
      // Items selected in filters
      $scope.selectedAuthors = [];
      $scope.selectedTags = [];
      $scope.firstDate = new Date();
      $scope.lastDate = new Date(); 
      $scope.firstDate.setDate($scope.firstDate.getDate() - 365);
      $scope.ratingMin = 0;
      $scope.ratingMax = 5;
      $scope.depthVal = 0;


      /*
       *
       */
      var resetDefaults = function(){
          $scope.selectedAuthors = [];
          $scope.selectedTags = [];
          $scope.firstDate = new Date();
          $scope.lastDate = new Date(); 
          $scope.firstDate.setDate($scope.firstDate.getDate() - 365);
          $scope.ratingMin = 0;
          $scope.ratingMax = 5;
          $scope.depthVal = 0;

          // clear actual filters
          $scope.tags.map( function(tag) { tag.selected = false; return tag; });
          $scope.authors.map( function(author) { author.selected = false; return author; });
      };

      $scope.clearFilter = function(){

            // reset defaults
            resetDefaults();

            $scope.filterActive = false; 

            refreshGraph();

      }


      /*
       *  Composes FilterURL to send to server & modifies graph
       *  d, g, r, u, t , tg
       * 
       */
      $scope.filterRequest = function(){

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


          $http.get(urlString).success(function(data){
              
              refreshGraph(data);
              $scope.filterActive = true;

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

        // look for better solutions to this
        
        $(".filter-heading").click(function(){

              // close other filter headings
              $('.filter-heading').siblings().hide();


              $(this).siblings().show();
        });

        refresh();

      }

      /*
       *  Refresh function that refreshes all lists
       */
      function refresh(){

          /*
           * Get list of tags to populate tags filter
           */
          tags.getAll().then(function(){
              $scope.tags = tags.tags.map( function(tag){

                  // add properties required for tree-view plugin
                  tag.parentId = null;
                  tag.isExpanded = false; 
                  tag.children = [];
                  
                  // default 
                  tag.selected = false;

                  return tag;

              });
          });
            
          /*
           *  Get groups to populate By Author Filter
           * 
           */
          groups.getAll().then(function(){

            /*
             * Groups preprocessing
             */

            var group_data = groups.groups;
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
              
          }).then( function(){

                /*
                 *  Get users to populate By Author filter
                 */
                users.getAll().then(function(){

                    var user_data = users.users;
                    $scope.authors = $scope.authors.concat( user_data.map( function(user){

                        user.parentId = null; 
                        user.isExpanded = false; 
                        user.children = [];
                        user.type = "user";
                        user.selected = false;

                        // default - select self
                        if(user.id == $scope.user.id)
                          user.selected = false; 

                        return user;

                    }) );

                });

          }) 




      }



}]);
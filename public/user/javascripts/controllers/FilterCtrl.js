angular.module('studionet')

/*
 * Controller for Filters
 */
.controller('FilterCtrl', ['$scope', '$http', 'users', 'tags', 'groups',   function($scope, $http, users, tags, groups){ 

     
      // Default Constants
      var default_selectedAuthors = [], default_selectedTags = [];
      var default_firstDate = new Date();
      var default_lastDate = new Date(); default_firstDate.setDate(default_firstDate.getDate() - 365);
      var default_ratingMin = 0, default_ratingMax = 5;
      var default_depthVal = 0;


      $scope.filterStatus = false;
      $scope.filterChanged = false;


      // Lists populating filters
      $scope.tags = [];
      $scope.authors = [];
      
      // Filter Selections
      $scope.selectedAuthors, $scope.selectedTags, 
      $scope.firstDate, $scope.lastDate, 
      $scope.ratingMin, $scope.ratingMax;
      $scope.depthVal;

     
      /*
       *
       */
      var resetDefaults = function(){
          
          $scope.selectedAuthors = default_selectedAuthors;
          $scope.selectedTags = default_selectedTags;
          $scope.firstDate = default_firstDate;
          $scope.lastDate = default_lastDate;
          $scope.ratingMin = default_ratingMin;
          $scope.ratingMax = default_ratingMax;
          $scope.depthVal = default_depthVal;

          // clear actual filters
          $scope.tags.map( function(tag) { tag.selected = false; return tag; });
          $scope.authors.map( function(author) { author.selected = false; return author; });
      };

      resetDefaults();


      $scope.clearFilter = function(){

            // reset defaults
            resetDefaults();

            $scope.filterActive = false; 

            refreshGraph();

      }

      /*
       * Check if filter is active and send the required output
       */  
      $scope.checkFilterActive = function( filtername ){
          //
          //    Fix later
          //
          switch (filtername) {
/*              case "authors":
                    if(!($scope.selectedAuthors.equals(default_selectedAuthors)))
                      return $scope.selectedAuthors.length;
                    break; 
              case "tags":
                    if($scope.selectedTags === default_selectedTags)
                      return $scope.selectedTags.length; 
                    break;
              case "date":
                    if ($scope.firstDate === default_firstDate && $scope.lastDate === default_lastDate)
                      return  (lastDate - firstDate) / 86400000 ; 
                    break;
              case "rating":
                    if($scope.ratingMin == default_ratingMin && $scope.ratingMax == default_ratingMax)
                      return  $scope.ratingMin + "-" + $scope.ratingMax; 
                    break;
              case "depth":
                    if($scope.depthVal === default_depthVal)
                      return $scope.depthVal;  
                    break;*/
              default:     
                    return "-";
          }

          return "-";

      };


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

              if(data.nodes.length == 0){
                console.log(data.nodes.length + " nodes found");
              }

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
       * TODO: find better fix (accordion)
       */
      $scope.init = function(){

        // look for better solutions to this
        
        $(".filter-heading").click(function(){

              // close filter headings
              // $('.filter-heading').not(this).siblings().hide(); //done by accordion therefore commented

              // $(this).siblings().toggle(); //done by accordion therefore commented

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
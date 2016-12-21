angular.module('studionet')

/*
 * Controller for Filters
 */
.controller('FilterCtrl', ['$scope', 'supernode', 'users', 'tags', 'groups', '$http',  function($scope, supernode, users, tags, groups, $http){ 

      // Lists populating filters
      $scope.tags = [];
      $scope.authors = [];
      
      // Filter Selections
      $scope.selectedAuthors, $scope.selectedTags, 
      $scope.firstDate, $scope.lastDate, 
      $scope.ratingMin, $scope.ratingMax;
      $scope.depthVal;

     
      /*
       *    Helper functions
       */
      var resetDefaults = function(){
          
          $scope.selectedAuthors = [];
          $scope.selectedTags = [];
          $scope.firstDate = new Date();
          $scope.lastDate = new Date(); $scope.lastDate.setDate($scope.firstDate.getDate() - 365);
          $scope.ratingMin = 0;
          $scope.ratingMax = 5;
          $scope.depthVal = 0;

          // clear actual filters
          $scope.tags.map( function(tag) { tag.selected = false; return tag; });
          $scope.authors.map( function(author) { author.selected = false; return author; });
      };

      var populateTags = function(){

        return tags.tags.map( function(tag){

            // add properties required for tree-view plugin
            tag.parentId = null;
            tag.isExpanded = false; 
            tag.children = [];
            
            // default 
            tag.selected = false;

            return tag;

        }); 

      };

      var populateGroups = function(){

          // create a hashmap for the group for easy reference by id
          var group_hash = {}; 
          groups.groups.map( function(group){
              group.type = "group";
              //group.name = group.name + "</b>" //'&#xf0c0;' + " " + group.name; // append unicode for group
              group.isExpanded = false;
              group.children = [];
              group_hash[group.id] = group;
          })

          // if group has parentId, add group to that parent's children array
          groups.groups =  groups.groups.map( function(group){
              if(group.parentId)
                  group_hash[group.parentId].children.push(group);
              return group;
          })

          // return groups connected to supernode
          return groups.groups.filter(function(group){
              return (group.parentId == supernode.group)
          })

      }

      var populateAuthors = function(){
          return users.users.map(function(user){

              user.type = "user";
              user.parentId = null; 
              user.isExpanded = false; 
              user.children = [];
              user.selected = false;

              return user;

          });
      }




      /* Filter Functions */
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


          console.log(urlString);

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
       *  Init function that refreshes all lists in the filters
       */
      $scope.init = function(){

          // filters to default values
          resetDefaults();

          // populate filters
          $scope.tags = populateTags();
          $scope.authors = populateAuthors();
          $scope.authors = $scope.authors.concat( populateGroups() );     

      }


}]);
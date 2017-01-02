angular.module('studionet')

/*
 * Controller for Filters
 */
.controller('FilterCtrl', ['$scope', 'supernode', 'users', 'tags', 'groups', '$http', '$filter', function($scope, supernode, users, tags, groups, $http, $filter){ 

      // defaults
      var DEFAULTS = {
            users : [],
            groups: [],
            tags : [],
            startDate: new Date( (new Date()).setDate((new Date().getDate()) - 8) ),
            endDate : new Date( (new Date()).setDate((new Date().getDate()) + 1) ),
            ratingMin : 0, 
            ratingMax : 5, 
            depthVal : 0
      }

      // Lists populating filters
      $scope.tags = [];
      $scope.users = [];
      $scope.groups = [];
      
      // Filter Selections
      $scope.selectedUsers, $scope.selectedGroups, $scope.selectedTags, 
      $scope.startDate, $scope.endDate, 
      $scope.ratingMin, $scope.ratingMax;
      $scope.depthVal;


      $scope.panelsOpen = true;

      var target = document.getElementById('cy');
      var spinner = new Spinner(STUDIONET.GRAPH.spinner);


      /*
       * Filter Visibility Options
       */
      $scope.filterVisible = false;
      $scope.toggleFilter = function(){
        console.log($scope.filterVisible);
        $scope.filterVisible = !$scope.filterVisible;
      }

      $scope.getFilterStatus = function(){
        console.log($scope.filterVisible);
        return $scope.filterVisible;
      }


      /*
       *    Helper functions
       */
      var resetDefaults = function(){
          
          $scope.selectedUsers = DEFAULTS.users;
          $scope.selectedGroups = DEFAULTS.groups;
          $scope.selectedTags = DEFAULTS.tags;
          $scope.startDate = DEFAULTS.startDate;
          $scope.endDate = DEFAULTS.endDate;
          $scope.ratingMin = DEFAULTS.ratingMin;
          $scope.ratingMax = DEFAULTS.ratingMax;
          $scope.depthVal = DEFAULTS.depthVal;

          // clear actual filters
          $scope.tags.map( function(tag) { tag.selected = false; return tag; });
          $scope.users.map( function(user) { user.selected = false; return user; });
          $scope.groups.map( function(group) { group.selected = false; return group; });

          $scope.panelsOpen = false;
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

      var populateUsers = function(){
          return users.users.map(function(user){

              user.type = "user";
              user.parentId = null; 
              user.isExpanded = false; 
              user.children = [];
              user.selected = false;

              return user;

          });
      }

      var checkDefaults = function(){
        if (  $scope.selectedUsers.length == DEFAULTS.users.length &&
              $scope.selectedGroups.length == DEFAULTS.groups.length &&
              $scope.selectedTags.length == DEFAULTS.tags.length && 
              $scope.startDate == DEFAULTS.startDate &&
              $scope.endDate == DEFAULTS.endDate && 
              $scope.ratingMin == DEFAULTS.ratingMin &&
              $scope.ratingMax == DEFAULTS.ratingMax &&
              $scope.depthVal == DEFAULTS.depthVal ){
          alert("No Filter Active");
          return true;
        }
        else
          return false;
     
      }

      var getTime = function(d){
        d.setHours(0);
        d.setMinutes(0);
        d.setSeconds(0);
        return d.getTime();
      }


      /* Filter Functions */
      $scope.clearFilter = function(){

            // reset defaults
            resetDefaults();

            $scope.filterActive = false; 

            $scope.graphInit();

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
                    if ($scope.startDate === default_startDate && $scope.endDate === default_endDate)
                      return  (endDate - startDate) / 86400000 ; 
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

          // if defaults, then don't run filter, run reset
          if( checkDefaults() ){
            $scope.clearFilter();
          }
          else{
              
              var urlString = '/api/contributions/filters'; 

              var groups = $scope.selectedGroups; //$scope.selectedAuthors.filter( function(g){ return (g.type == "group") });
              var users = $scope.selectedUsers; //$scope.selectedAuthors.filter( function(g){ return (g.type == "user") });

              var groupsUrlSeg = ( groups.length ? "[" + groups.map( function(g){ return g.id } ).toString() + "]" : ( users.length > 0 ? "[]" : "-1" ) )  // groups
              var usersUrlSeg = ( users.length ? "[" + users.map( function(u){ return u.id } ).toString() + "]"  : ( groups.length > 0 ? "[]" : "-1" ) ) // users


              var data = {};
              data.g = groupsUrlSeg;
              data.u = usersUrlSeg; 
              data.tg = ( $scope.selectedTags.length ? "[" + $scope.selectedTags.map( function(g){ return g.id; }).toString() + "]" : "-1" );
              data.r = "[" + $scope.ratingMin + "," + $scope.ratingMax + "]";
              data.t = "[" + getTime($scope.startDate) + "," + getTime($scope.endDate) + "]"
              data.d =  $scope.depthVal;

              //  Create the URL String
            
/*              urlString +=  "g=" + groupsUrlSeg

              + "&u=" + usersUrlSeg

              + "&tg=" + ( $scope.selectedTags.length ? "[" + $scope.selectedTags.map( function(g){ return g.id; }).toString() + "]" : "-1" )  // tags

              + "&r=[" + $scope.ratingMin + "," + $scope.ratingMax + "]"    // rating

              + "&t=[" + getTime($scope.startDate) + "," + getTime($scope.endDate) + "]"   // time

              + "&d=" + $scope.depthVal;   // depth*/

              console.log(data);

              $(target).empty();
              spinner.spin(target);

              $http({
                method  : 'POST',
                url     : '/api/contributions/filters',
                headers : { 'Content-Type': 'application/json' }, 
                data    : data
              }).success(function(data){

                  $scope.filterActive = true;
                  spinner.stop();

                  console.log(data);
                  if(data.nodes == undefined || data.nodes.length == 0){
                    $(target).append("<h3 style='position: absolute; top:40%; left: 40%;'>Oops. No Nodes found.</h3>");
                  }
                  else{
                    $scope.graphInit(data);
                  }

              });

          }

          $scope.panelsOpen = false;

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
          $scope.tags = $filter('orderBy')(populateTags(), 'contributionCount', true) ;
          $scope.users = $filter('orderBy')(populateUsers(), 'name') ;
          $scope.groups = $filter('orderBy')(populateGroups(), 'name') ;

      }


}]);
angular.module('studionet')

/*
 * Controller for Filters
 */
.controller('FilterCtrl', ['$scope', 'supernode', 'users', 'tags', 'groups', '$http', '$filter', 'graph', function($scope, supernode, users, tags, groups, $http, $filter, graph){ 

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

      
      var spinner = new Spinner(STUDIONET.GRAPH.spinner);

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
            alert("Filters set to default.");
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


      // -- Function called by parent container to clear individual filters;
      var USERS_FILTER_CODE = 0; 
      var GROUPS_FILTER_CODE = 1; 
      var TAGS_FILTER_CODE = 2; 
      var DATE_FILTER_CODE = 3; 
      var RATING_FILTER_CODE = 4; 
      var DEPTH_FILTER_CODE = 5; 
      $scope.clearIndividualFilter = function(code){

        // clear code filter
        switch (code){

          case USERS_FILTER_CODE:
            $scope.selectedUsers = DEFAULTS.users; 
            break;
          case GROUPS_FILTER_CODE:
            $scope.selectedGroups = DEFAULTS.groups; 
            break;
          case TAGS_FILTER_CODE:
            $scope.startDate == DEFAULTS.startDate 
            $scope.endDate == DEFAULTS.endDate  
            break;
          case DATE_FILTER_CODE:
            $scope.selectedUsers = DEFAULTS.users; 
            break;
          case RATING_FILTER_CODE:
            $scope.ratingMin == DEFAULTS.ratingMin 
            $scope.ratingMax == DEFAULTS.ratingMax 
            break;
          case DEPTH_FILTER_CODE:
            $scope.depthVal == DEFAULTS.depthVal 
            break;
        }


        // filter request
        $scope.filterRequest();

      }


      /* Filter Functions */
      $scope.clearFilter = function(){

            // reset defaults
            resetDefaults();

            graph.unmarkNodes();

            // remove in parent
            $scope.updateFilter([])

      }

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

              //$(target).empty();
              target = document.getElementById('cy');
              spinner.spin(target);

              $http({
                method  : 'POST',
                url     : '/api/contributions/filters',
                headers : { 'Content-Type': 'application/json' }, 
                data    : data
              }).success(function(filter_data){

                  $scope.filterActive = true;
                  spinner.stop();

                  if(filter_data.nodes == undefined || filter_data.nodes.length == 0){
                    //$('').append("<h3 style='position: absolute; top:40%; left: 40%;'>Oops. No Nodes found.</h3>");
                  }
                  else{

                    var filters = [];
                    // --- setting the shortcut option in parent container
                    if ($scope.selectedGroups.length != DEFAULTS.groups.length)
                        filters.push({ 'name' : 'Groups', value: $scope.selectedGroups.length + " group(s) selected", code: GROUPS_FILTER_CODE });
                    if ($scope.selectedUsers.length != DEFAULTS.users.length)
                        filters.push({ 'name' : 'Users', value: $scope.selectedUsers.length + " user(s) selected", code: USERS_FILTER_CODE });                    
                    if ($scope.selectedTags.length != DEFAULTS.tags.length)
                        filters.push({ 'name' : 'Tags', value: $scope.selectedTags.length + " tag(s) selected", code: TAGS_FILTER_CODE });
                    if ($scope.startDate != DEFAULTS.startDate && $scope.startDate != DEFAULTS.endDate )
                        filters.push({ 'name' : 'Time Range', value: ( $scope.startDate - $scope.endDate ) + " days", code: DATE_FILTER_CODE  });
                    if ($scope.minRating != DEFAULTS.minRating && $scope.maxRating != DEFAULTS.maxRating)
                        filters.push({ 'name' : 'Rating', value: ( $scope.startDate + " - " + $scope.endDate ), code: RATING_FILTER_CODE });
                    if ($scope.depthVal != DEFAULTS.depthVal)
                        filters.push({ 'name' : 'Depth', value: $scope.depthVal, code: DEPTH_FILTER_CODE });
                    $scope.updateFilter(filters);

                    // --- mark the nodes in the graph
                    var nodes = [];
                    filter_data.nodes.map(function(node){
                      
                      if(node.match){
                            nodes.push(node.id);
                      }
                      
                      $('#filter-nodes-count').empty();
                      $('#filter-nodes-count').append( nodes.length + " matching nodes found");


                    })

                    graph.markNode(nodes);
                  
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

      $scope.close = function() {

        $('body').removeClass('modal-open');
        $('.modal-backdrop').remove();

      };

}]);
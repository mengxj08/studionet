

angular.module('studionet')

/*
 * Controller for Filters
 */
.controller('FilterController', [ '$scope', '$rootScope', '$element', '$http', '$filter', 
                                  'supernode', 'users', 'tags', 'groups', 'GraphService', 
                                  function($scope, $rootScope, $element, $http, $filter, supernode, users, tags, groups, GraphService){ 

      // Constants
      var FILTER_URL = '/api/contributions/filters'; 
      var DEFAULTS = {
            users : [],
            groups: [],
            tags : [],
            startDate: undefined,//new Date( (new Date()).setDate((new Date().getDate()) - 8) ),
            endDate : undefined,//new Date( (new Date()).setDate((new Date().getDate()) + 1) ),
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


      // create a hashmap for the group for easy reference by id
      var group_hash = groups.groups.hash();


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

          // reset actual filters - clear selections
          $scope.tags.map( function(tag) { tag.selected = false; return tag; });
          $scope.users.map( function(user) { user.selected = false; return user; });
          $scope.groups.map( function(group) { group.selected = false; return group; });

      };
      resetDefaults();

      var populateTags = function(){

        return tags.tags.filter( function(tag){

            if (tag.isExpanded != undefined)
                return tag;

            var access = true; 

            if( tag.restricted == true/* &&  group_hash[tag.group].requestingUserStatus == null */)
              access = false;

            // check if tag restricted and if yes, if user has access to tag
            if( access ){
              // add properties required for tree-view plugin
              tag.parentId = null;
              tag.isExpanded = false; 
              tag.children = [];
              
              // default 
              tag.selected = false;

              return tag; 
            }
            else{
              return;
            }

        }); 

      };

      var populateGroups = function(){

          // if group has parentId, add group to that parent's children array
          var all_groups =  groups.groups.map( function(group){

              // check if this procedure as already been done before
              // todo: find better way
              if (group.type != undefined)
                  return group;

              // check if group is the supernode because supernode has no parent
              if(group.id == supernode.group){
                  return group;
              }


              var parent = group_hash[group.parentId]; 
              
              if( parent.children == undefined )
                  parent.children = [];
              
              group.isExpanded = false;
              group.type = "group";
              parent.children.push(group);

              return group;
          });

          all_groups = all_groups.filter(function(g){

              if(g.requestingUserStatus == null && g.restricted == true){
                return false; 
              }
              else if( g.id == supernode.group)
                return false;
              else if(g.parentId == supernode.group){
                return true;
              }
          
          });

          // return groups connected to supernode and accessible to the user
          return all_groups;

      }

      var populateUsers = function(){

          // potential errors?
          var user_list = JSON.parse(JSON.stringify(users.users));

          return user_list.filter(function(user){

              if(user.activityArr[2]){
                user.note = "( Nodes: " + user.activityArr[2] + " )";

                if (user.type != undefined)
                    return user;

                user.name = (user.nickname ? user.nickname : user.name);

                user.type = "user";
                user.parentId = null; 
                user.isExpanded = false; 
                user.children = [];
                user.selected = false;

                return true;
                
              }
              else
                return false;
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
            console.log("Filters set to default.");
            return true;
          }
          else
            return false;
     
      }

      var getTime = function(d){
        d.setHours(23);
        d.setMinutes(59);
        d.setSeconds(59);
        return d.getTime();
      }


      // -- Function called by parent container to clear individual filters;
      var USERS_FILTER_CODE = 0; 
      var GROUPS_FILTER_CODE = 1; 
      var TAGS_FILTER_CODE = 2; 
      var DATE_FILTER_CODE = 3; 
      var RATING_FILTER_CODE = 4; 
      var DEPTH_FILTER_CODE = 5; 

      $scope.$on( BROADCAST_CLEAR_FILTER, function(event, args) {
          $scope.clearFilterFromGraph(event, args);
      });

      var deselectListItem = function(value, list){
          
          var selectedList = "selected" + list.substr(0, 1).toUpperCase() + list.substr(1, list.length);
          $scope[selectedList] = $scope[selectedList].filter( function(ele){
              return ele.id != value;
          });

          //console.log($scope["selected" + list.substr(0, 1).toUpperCase() + list.substr(1, list.length) ]);

          $scope[list] = $scope[list].map( function(ele){
                if(ele.id == value)
                  ele.selected =  false; 

                // check if element has children (for groups)
                if(ele.children !== undefined){

                    ele.children.map(function(child){
                      if(child.id == value)
                        child.selected = false;
                      return child;
                    })
                
                }

                return ele;
          });
      
      }

      $scope.clearFilterFromGraph = function(event, args){
          
          var code = args.code;
          var value = args.value;

          // clear code filter
          switch (code){

            case USERS_FILTER_CODE:
              deselectListItem( value, "users");
              break;
            case GROUPS_FILTER_CODE:
              deselectListItem( value, "groups");
              break;
            case TAGS_FILTER_CODE:
              deselectListItem( value, "tags");
              break;
            case DATE_FILTER_CODE:
              $scope.startDate = DEFAULTS.startDate;
              $scope.endDate = DEFAULTS.endDate;
              break;
            case RATING_FILTER_CODE:
              $scope.ratingMin = DEFAULTS.ratingMin 
              $scope.ratingMax = DEFAULTS.ratingMax 
              break;
            case DEPTH_FILTER_CODE:
              $scope.depthVal = DEFAULTS.depthVal 
              break;
          }


          // filter request
          $scope.filterRequest();        
      }


      /* Filter Functions */
      $scope.clearFilter = function(){

            // reset defaults
            resetDefaults();

            GraphService.unmarkNodes();

            // remove in parent
            $rootScope.$broadcast(BROADCAST_CLEAR_ALL_FILTERS);

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

              var data = {};
              data.g =  ( $scope.selectedGroups.length ? "[" + $scope.selectedGroups.map( function(g){ return g.id } ).toString() + "]" : ( $scope.selectedUsers.length > 0 ? "[]" : "-1" ) ) ;
              data.u = ( $scope.selectedUsers.length ? "[" + $scope.selectedUsers.map( function(u){ return u.id } ).toString() + "]"  : ( $scope.selectedGroups.length > 0 ? "[]" : "-1" ) ); 
              data.tg = ( $scope.selectedTags.length ? "[" + $scope.selectedTags.map( function(g){ return parseInt(g.id); }).toString() + "]" : "-1" );
              data.r = "[" + $scope.ratingMin + "," + $scope.ratingMax + "]";
              data.t = "[" + ( $scope.startDate ? getTime($scope.startDate)  : 0 )  + " ,"  + ( $scope.endDate ? getTime($scope.endDate) : getTime( new Date() ) ) + "]";
              data.d =  $scope.depthVal; 

              $http({
                method  : 'POST',
                url     : FILTER_URL,
                headers : { 'Content-Type': 'application/json' }, 
                data    : data
              }).success(function(filter_data){

                  var nodes = [];

                  if(filter_data.nodes == undefined || filter_data.nodes.length == 0){
                    nodes = [];
                  }
                  else{
                    nodes = filter_data.nodes.filter(function(node){   return ( node.match ? node.id : false );             });
                  }
 
                  // --- mark the nodes in the graph
                  GraphService.markNode( nodes.map(function(node){ return node.id } ) );

                  var data = [];
                  // --- setting the shortcut option in parent container
                  // check if filter has default values and insert only if it doesn't
                  if ($scope.selectedGroups.length != 0)
                      data.push({ 'name' : 'Groups', value: $scope.selectedGroups, code: GROUPS_FILTER_CODE , type: 'Array'});
                  if ($scope.selectedUsers.length != 0)
                      data.push({ 'name' : 'Users', value: $scope.selectedUsers, code: USERS_FILTER_CODE, type: 'Array' });                    
                  if ($scope.selectedTags.length != 0)
                      data.push({ 'name' : 'Tags', value: $scope.selectedTags, code: TAGS_FILTER_CODE, type: 'Array' });
                  if ($scope.startDate != DEFAULTS.startDate || $scope.startDate != DEFAULTS.endDate )
                      data.push({ 'name' : 'Time Range', value: ( ($scope.endDate - $scope.startDate)/(1000*24*3600) ).toFixed() + " days", code: DATE_FILTER_CODE, type: 'Range'  });
                  if ($scope.ratingMin != DEFAULTS.ratingMin || $scope.ratingMax != DEFAULTS.ratingMax)
                      data.push({ 'name' : 'Rating', value: ( $scope.ratingMin + " - " + $scope.ratingMax ) + " rating", code: RATING_FILTER_CODE, type: 'Range' });


                  // broadcast results
                  $rootScope.$broadcast(BROADCAST_FILTER_ACTIVE, { 'nodes': nodes, 
                                                                   'data': data });
              });

          }


      };

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
      $scope.init = function(reset){

          // populate filters 
          $scope.tags = $filter('orderBy')(populateTags(), [ "name", "-contributionCount" ]) ;
          $scope.users = $filter('orderBy')(populateUsers(), 'name') ;
          $scope.groups = $filter('orderBy')(populateGroups(), [ "children.length" , "name" ]) ;
      }

      $scope.closeFilter = function() {

          $('body').removeClass('modal-open');
          $('.modal-backdrop').remove();

          console.log("Closed Filters");
      };

}]);

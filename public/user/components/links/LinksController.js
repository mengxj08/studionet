/*
 *	Controller for Links
 * 
 */
angular.module('studionet')

.controller('LinksController', ['$scope', '$rootScope', 'GraphService', 'links', 'profile', 'users', function($scope, $rootScope, GraphService, links, profile, users){

	$scope.createMode = undefined;

    $scope.target = undefined;
    $scope.source = undefined;
    $scope.linkNode; 

    var usersHash = users.usersHash;

    var getName = function(user_id){
        return usersHash[user_id].nickname ? usersHash[user_id].nickname : usersHash[user_id].name
    }
    $scope.getName = getName;

    $scope.goToUser = function(user_id){
        $('#profileModal').modal({backdrop: 'static', keyboard: false});
        $rootScope.$broadcast( "PROFILE_MODE",  {id: user_id});
    }

    $scope.goToNode = function(node){
        $('#contributionViewModal').modal({backdrop: 'static', keyboard: false});
        $rootScope.$broadcast("VIEWMODE_ACTIVE", {data: node});
    }


    // ----------------- For Link creation

    $rootScope.$on("CREATE_EDGE_MODAL", function(event, args){

    	console.log(args);

    	$scope.source = args.src; // getNode(args.src, false);
    	$scope.target = args.target;

    	$scope.createMode = true;

    	$scope.$apply();

    	$('#linksModal').modal({backdrop: 'static', keyboard: false});

    })

    $scope.addLink = function(){

    	var linkData = {
    		source : $scope.source.id, 
    		target: $scope.target.id, 
    		note: $scope.linkNote
    	}

    	links.createLink(linkData).success(function(){
    		// alert("Link created in database!");
    	})
    }

    // --------------  For Link Viewing

    $rootScope.$on("VIEW_EDGE_MODAL", function(event, args){

    	$scope.edge = args.edge.data(); // getNode(args.src, false);
    	$scope.linkNode = {};

        $scope.manualLink = false;

        $scope.sourceNode = GraphService.graph.getElementById( $scope.edge.source ).data();
        $scope.targetNode = GraphService.graph.getElementById( $scope.edge.target ).data();

        if(links.linksHash[$scope.edge.id] != undefined){

            $scope.manualLink = true;

            $scope.linkNode = links.linksHash[$scope.edge.id];

            if($scope.linkNode.createdBy == profile.user.id)
                $scope.linkOwner = true;

        }

        if($scope.author == undefined)
            $scope.author = {id: $scope.sourceNode.createdBy, name: getName( $scope.sourceNode.createdBy )};
        
        if($scope.author.id == profile.user.id){
            $scope.linkOwner = true;
        }

        $scope.createMode = false;
    	
    	$scope.$apply();

    	$('#view_links_modal').modal({backdrop: 'static', keyboard: false});

    });

    $scope.deleteLink = function(){
    	links.deleteLink($scope.edge.id);
    };


}]);
/*
 *	Controller for Links
 * 
 */
angular.module('studionet')

.controller('LinksController', ['$scope', '$rootScope', 'GraphService', 'links', function($scope, $rootScope, GraphService, links){

	$scope.createMode = undefined;

    $scope.target = undefined;
    $scope.source = undefined;
    $scope.linkNode; 


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
    	$scope.linkNode = undefined

    	if(links.linksHash[$scope.edge.id] != undefined){
    		$scope.linkNode = links.linksHash[$scope.edge.id];
    	}

    	$scope.createMode = false;
    	
    	$scope.$apply();


    	$('#view_links_modal').modal({backdrop: 'static', keyboard: false});

    });

    $scope.deleteLink = function(){
    	links.deleteLink($scope.edge.id);
    };


}]);
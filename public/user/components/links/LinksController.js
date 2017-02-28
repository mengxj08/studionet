/*
 *	Controller for Links
 * 
 */
angular.module('studionet')

.controller('LinksController', ['$scope', '$rootScope', 'GraphService', 'links', function($scope, $rootScope, GraphService, links){

    $scope.target = undefined;
    $scope.source = undefined;
    $scope.linkNode; 

    $rootScope.$on("SHOW_EDGE_MODAL", function(event, args){

    	console.log(args);

    	$scope.source = args.src; // getNode(args.src, false);
    	$scope.target = args.target;

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



}]);
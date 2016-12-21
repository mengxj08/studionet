angular.module('studionet')

/*
 * Controller for Filters
 */
.controller('NavCtrl', ['$scope', '$http', 'profile', function($scope, $http, profile){

		$scope.user = profile.user;
		$scope.filters = profile.user.filterNames || []; 
		$scope.filters_ref = profile.user.filters || []; 


		/*
		*
		*  Search Functionality
		* 
		*/
		$scope.textFilter = "";
		$scope.searchActive = false;

		$scope.textSearchFilter = function(searchText){

		  console.log("text search")

		  if(searchText ==  "")
		    return; 

		  $scope.searchActive = true;

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

			console.log("clear");

			$scope.textFilter = "";
			$scope.searchActive = false;
			cy.elements().removeClass('highlighted')
			cy.elements().removeClass('searched')
		}


}]);
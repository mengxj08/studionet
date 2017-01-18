angular.module('studionet')

/*
 * Controller for Filters
 */
.controller('NavCtrl', ['$scope', 'profile', 'ModalService', function($scope, profile, ModalService){

		//console.log($scope.graph);

		$scope.user = profile.user;
		$scope.filters = profile.user.filterNames || []; 
		$scope.filters_ref = profile.user.filters || []; 

		$scope.toggleFilter = function(){
			angular.element('.graph-container').scope().showFilter = !angular.element('.graph-container').scope().showFilter;
		}

		$scope.showProfile = function(){
			
/*			ModalService.showModal({
				templateUrl: "/user/templates/profile.html",
				controller: "ProfileCtrl",
				inputs: {
				  title: "User Profile"
				},
				scope: $scope
			}).then(function(modal) {
			    modal.element.modal({
			      backdrop: 'static'
			      // keyboard: false
			    });

			    // compute the stats for the user
			    modal.scope.computeStats();
			    
			});
*/
		}

		/*
		*
		*  Search Functionality
		* 
		*/
		$scope.textFilter = {};
		$scope.textFilter.text = "";
		$scope.textFilter.active = false;

		$scope.textSearchFilter = function(searchText){

		  console.log("text search")

		  	if(searchText ==  "")
		    	return; 

		  	$scope.textFilter.active = true;

			  cy.nodes().forEach(function( ele ){
			      
			      if( (ele.data().name).toLowerCase().includes( searchText.toLowerCase() )){
			        console.log( ele.data().name );
			        ele.addClass('searched');
			        ele.connectedEdges().addClass('highlighted');
			        $scope.textFilter.active = true;
			      }
			     
			  });
		}

		$scope.clearSearch = function(){

			console.log("clear");

			$scope.textFilter.text = "";
			$scope.textFilter.active = false;
			cy.elements().removeClass('highlighted')
			cy.elements().removeClass('searched')
		}


}]);



angular.module('studionet')

/*
 *  Main Contribution Graph Page
 * 
 */
.controller('HomeCtrl', ['$scope', 'profile', 'Upload', '$timeout', 'modelsFactory', 'ModalService', '$http', 

 function($scope, profile, Upload, $timeout, modelsFactory, ModalService, $http){

	$scope.user = profile.user;
	$scope.modules = profile.modules;
  $scope.userModels = modelsFactory.userModels;
  
	$scope.isAdmin = profile.modules.reduce(function(res, curr){
		return res || curr.role==='Admin';
	}, false); 

  /*
   *
   *  Search Functionality
   * 
   */
  $scope.textFilter = "";
  $scope.searchActive = false;

  $scope.textSearchFilter = function(searchText){

      if(searchText ==  "")
        return; 

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
    $scope.textFilter = "";
    $scope.searchActive = false;
    cy.elements().removeClass('highlighted')
    cy.elements().removeClass('searched')
  }

  $scope.resetGraph = function(){

    cy.reset();
  }


  /*
   *  List of all users
   * 
   */
  $scope.users = {};
  $http.get('/api/users/').success(function(user_data){

      user_data.map( function(u){
          $scope.users[ u.id ] = u;
      })

  });


  /*
   *
   *  Contribution Details
   *
   * 
   */


  $scope.showDetailsModal = function(data) {

      ModalService.showModal({
        templateUrl: "/user/templates/home.graphView.modal.html",
        controller: "DetailsModalCtrl",
        inputs: {
          title: "A More Complex Example"
        }
      }).then(function(modal) {
        modal.element.modal({
          backdrop: 'static'
          // keyboard: false
        });

        /// set data
        modal.scope.setData(data);

/*        modal.close.then(function(result) {
          //$scope.complexResult  = "Name: " + result.name + ", age: " + result.age;
        });*/
        
      });

    };

}])


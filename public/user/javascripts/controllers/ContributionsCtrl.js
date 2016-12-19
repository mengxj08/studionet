angular.module('studionet')

/*
 *  Main Contribution Graph Page
 * 
 */
.controller('ContributionsCtrl', ['$scope', 'profile', 'users', 'Upload', '$timeout', 'ModalService', '$http', function($scope, profile, users, Upload, $timeout, ModalService, $http){

	$scope.user = profile.user;
  $scope.users = users.usersById();

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
      cy.layout().stop(); 
      layout =cy.elements().makeLayout({ 'name': 'cola'}); 
      layout.start();   
  }


  /*
   *
   *  Contribution Details
   *
   * 
   */
  $scope.showDetailsModal = function(data, clickedContributionId) {

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
        modal.scope.setData(data,clickedContributionId);
        
        // modal.close.then(function(result) {
        //   //$scope.complexResult  = "Name: " + result.name + ", age: " + result.age;
        // });

        //Clear the possibly shown mouse-over thumbnail 
        $('#content-block-hover').html("");
        $('#content-block-hover').hide();  
      });

    };

}])


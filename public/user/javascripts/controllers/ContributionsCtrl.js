angular.module('studionet')

/*
 *  Main Contribution Graph Page
 * 
 */
.controller('ContributionsCtrl', ['AppContextService','$scope', 'profile', 'users', 'Upload', '$timeout', 'ModalService', '$http', function(AppContextService, $scope, profile, users, Upload, $timeout, ModalService, $http){

  /* todo: reset graph so top bar knows about the graph */
  AppContextService.setGraph(true);
  //console.log(AppContextService);

	$scope.user = profile.user;
  $scope.users = users.usersById();   // needed for hover to get user name - fix later

  /*
   *    Create Graph
   */
  
  var graphInit = function(){
    // code to generate graph
  }


  /* 
   *    Nav Controls
   */
  $scope.resetGraph = function(){
      cy.layout().stop(); 
      layout = cy.elements().makeLayout({ 'name': 'cola'}); 
      layout.start();   
  }

  $scope.createNewContribution = function(){
    alert("Creates a new contribution");
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


      });

  };




}])


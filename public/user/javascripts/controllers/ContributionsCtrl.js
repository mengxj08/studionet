var GRAPH_CONTAINER = document.getElementById('cy');

var BROADCAST_FILTER_ACTIVE = "filter-started";
var BROADCAST_CLEAR_FILTER = "filter-cleared";
var BROADCAST_CLEAR_ALL_FILTERS = "filter-clear-all";
var BROADCAST_CONTRIBUTION_CLICKED = "contribution-clicked";
var BROADCAST_VIEWMODE_OFF = "contribution-viewer-closed";

var BROADCAST_MESSAGE = "message-sent";




angular.module('studionet')

/*
 *  Main Contribution Graph Page
 * 
 */
.controller('ContributionsCtrl', ['$scope', '$stateParams', '$rootScope', 'graph', 'users', 'supernode', 'ModalService', 'contribution', function($scope, $stateParams, $rootScope, graph, users, supernode, ModalService, contribution){

  /*
   * Helper Fn
   */
  var tagCorrectionFn = function(data){
      if( data.tags == null )
        data.tags = [];
      
      if(data.tags != null && data.tags.length == 1 && data.tags[0] == "")
        data.tags = [];

      return data;
  }

  // --------------- sockets
  socket.on('contribution_rated', function (data) {
    
    // update the graph colors
    $scope.graph.getElementById(data.id).data('rating', data.rating);

    // update the db_data of the node that is displayed in the modal
    $scope.graph.getElementById(data.id).data('db_data', tagCorrectionFn(data) );

  });

  socket.on('contribution_viewed', function (data) {
    
    $scope.graph.getElementById(data.id).flashClass('glow', 500)
    for(i = 0; i < 30; i++){
      setTimeout(function(){
        $scope.graph.getElementById(data.id).flashClass('glow', 500)
      }, 1000*i)
    
    }

  });


  var showMessage = function(msg){

      $scope.message = msg;

      for(i=0;i<5;i++) {
        $('#message').fadeTo('slow', 0.5).fadeTo('slow', 1.0);
      }

      setTimeout(function(){
        $('#message').hide();
      }, 7000)


      // hack
      // todo : change later
      //$('.modal-backdrop').remove();
  
  }


  // ---------------- Filters
  $scope.filters = [];
  $scope.matchingNodes = [];

  // when message received
  $scope.$on( BROADCAST_MESSAGE, function(event, args) {
      console.log("Message received", args.message);
      showMessage(args.message);

  });

  // when filter is active
  $scope.$on( BROADCAST_FILTER_ACTIVE, function(event, args) {
      $scope.matchingNodes = args.nodes;
      $scope.filters = args.data;
  });

  // when filter is cleared
  $scope.$on( BROADCAST_CLEAR_ALL_FILTERS, function(event, args) {
      $scope.matchingNodes = [];
      $scope.filters = [];
  });


  $scope.clearFilter = function(code, optional_value){
    ///$scope.filterModal.scope.clearFilterFromGraph( null, { 'code': code, 'value': optional_value } );
    $rootScope.$broadcast(BROADCAST_CLEAR_FILTER, { 'code': code, 'value': optional_value });
  }
  


  // ----------------- Graphs
  // First Initialization of the graph on page-refresh
  $scope.graphInit = function(){  
    graph.getGraph(angular.element('#cy')[0]);  
  }


  // Highlight any state params
  var highlightStateParams = function(){

      // highlight node, if any in route params
      if($stateParams.contributionId && $scope.graph.getElementById( $stateParams.contributionId ) ){

        var node = $scope.graph.getElementById( $stateParams.contributionId)
        graph.selectNodePermanent( node );

        // fit the graph
        $scope.graph.fit( '#' + node.id() )

      }
  }

  var showQTip = function(evt){

      var node = evt.cyTarget;

      var data = node.data();

      var qtipFormat = STUDIONET.GRAPH.qtipFormat(evt);

      var auth = users.getUser( node.data('createdBy'), false );
      
      qtipFormat.id = "qTip-" +  node.id();
      qtipFormat.content.text =  node.data('name') + "<br>- " + ( (auth.nickname !=null && auth.nickname.length) ? auth.nickname : auth.name)

      node.qtip(qtipFormat, evt);  
  
  }


  var onEdgeSingleClick = function(evt){
    
    console.log("Edge clicked", evt.cyTarget.data());
    //var edge = evt.cyTarget;
    //showEdgesModal(edge.data());
  }

  // Interaction on Single Click
  var onNodeSingleClick = function(evt, dbl){

        var node = evt.cyTarget;

        showQTip(evt);
        
        // select the node and highlight connections
        graph.selectNode(node);

               
  }

  // Graph Interaction for Double Click
  var onNodeDoubleClick = function(evt){

        console.log("Double click");

        var node = evt.cyTarget;

        $scope.graph.elements().removeClass('highlighted');
        
        var data = node.data();

        var nodeTree = [];
        nodeTree.push(data);

        // if data is already defined, donot load again - directly show modal
        // db_data stores additional-data from the server
        if(node.data('db_data')){

          if($scope.viewMode == false)
            showDetailsModal( nodeTree, node.id() );
          else
            console.warn("Modal already showing");

        }
        else{
          console.warn("Data not defined for selected node;");

          // check again after 400ms
          setTimeout(function(){
            if(node.data('db_data') !== undefined)
              showDetailsModal( nodeTree, node.id() );
          }, 400);
          
        }
  }



  // Add graph interactions
  var addGraphInteractions = function(){

      // remove all listeners first 
      $scope.graph.off("tap");
      $scope.graph.off("mouseover");

      // ---- Reattach interactions to the graph

      // remove supernode
      $scope.graph.getElementById(supernode.contribution).remove();

      // redraw graph
      var threshold = 20; 
      STUDIONET.GRAPH.draw_graph($scope.graph, threshold);
    
      // Display the entire node name
      $scope.graph.on('mouseover', 'node', function(evt){
          showQTip(evt);
      });

      $scope.graph.on('tap', function(evt){
        if( evt.cyTarget.isEdge && evt.cyTarget.isEdge() )
            onEdgeSingleClick(evt);
        else if( !( (evt.cyTarget.isNode && evt.cyTarget.isNode()) ) ){
            graph.removeAdditionalStyles();
        }
        else if( evt.cyTarget.isNode && evt.cyTarget.id() == graph.activeNode ){
            console.log(graph.activeNode);
            onNodeDoubleClick(evt);
        }
        else if( evt.cyTarget.isNode() ){
            console.log("single click");
            onNodeSingleClick(evt);
        }
        else
          console.warn("Undefined Interaction");
      });

  }

  // Observe the Graph Service for Changes and register observer
  var updateGraph = function(){
      
      $scope.graph = graph.graph;
      highlightStateParams();
      addGraphInteractions();

  };
  graph.registerObserverCallback(updateGraph);


  // ------------- Zooming & Nav Controls
  $scope.zoomLevel = "Calibrating...";
  var updateZoom = function(){
    if($scope.graph){
      $scope.zoomLevel = (100*$scope.graph.zoom()).toPrecision(4);
      $scope.$apply();
    }
  }
  setTimeout(updateZoom, 1000);
  document.getElementById("cy").addEventListener("wheel", updateZoom);

  $scope.resetGraph = function(){
    $scope.graph.fit();
  }


  //  ------------- Modals
  $scope.openNewContributionModal = function(){
/*      ModalService.showModal({
        templateUrl: "/user/templates/createContributionModal.html",
        controller: "CreateContributionCtrl",
        scope: $scope

      }).then(function(modal) {
          // activate modal
          modal.element.modal({ backdrop: 'static' });
      });*/
  } 

  var showEdgesModal = function(link_data){

      ModalService.showModal({
          templateUrl: "/user/templates/linksModal.html",
          controller: "LinksCtrl",
          scope: $scope
      }).then(function(modal) {

          modal.scope.setData(link_data);

          modal.element.modal({
            backdrop: 'static'
          });
          
      });

  }

  $scope.viewMode = false;
  $scope.$on( BROADCAST_VIEWMODE_OFF, function(event, args) {
    $scope.viewMode = false;
  });
  var showDetailsModal = function(data, clickedContributionId) {

      $scope.viewMode = true;

      // show the details modal
      ModalService.showModal({
          templateUrl: "/user/templates/contributionDetailsModal.html",
          controller: "DetailsModalCtrl",
          scope: $scope
      }).then(function(modal) {

          modal.scope.setData(data, clickedContributionId);

          modal.element.modal({
            backdrop: 'static'
          });
          
      });

  };


}])


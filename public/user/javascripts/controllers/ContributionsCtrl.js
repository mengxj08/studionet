var GRAPH_CONTAINER = document.getElementById('cy');

var BROADCAST_FILTER_ACTIVE = "filter-started";
var BROADCAST_CLEAR_FILTER = "filter-cleared";
var BROADCAST_CLEAR_ALL_FILTERS = "filter-clear-all";
var BROADCAST_CONTRIBUTION_CLICKED = "contribution-clicked";

var BROADCAST_MESSAGE = "message-sent";


angular.module('studionet')

/*
 *  Main Contribution Graph Page
 * 
 */
.controller('ContributionsCtrl', ['$scope', '$stateParams', '$rootScope', 'graph', 'users', 'supernode', 'ModalService', 'contribution', function($scope, $stateParams, $rootScope, graph, users, supernode, ModalService, contribution){

  $scope.loggedInUsers = 1;

  // --------------- sockets
  socket.on('contribution_viewed', function (data) {
    
    console.log("viewed", data);

    $scope.graph.getElementById(data.id).flashClass('glow', 500)
    for(i = 0; i < 30; i++){
      setTimeout(function(){
        $scope.graph.getElementById(data.id).flashClass('glow', 500)
      }, 1000*i)
    
    }

    //showMessage("Someone is viewing " + $scope.graph.getElementById(data.id).data().name )
    

  });

  var showMessage = function(msg){

      $scope.message = msg;

      $scope.$apply();

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
      $scope.message = args.message;

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
  $scope.graphInit = function(){  graph.getGraph(angular.element('#cy')[0]);  }


  // Highlight any state params
  var highlightStateParams = function(){

      // highlight node, if any in route params
      if($stateParams.contributionId && $scope.graph.getElementById( $stateParams.contributionId ) ){

        var node = $scope.graph.getElementById( $stateParams.contributionId)
        graph.selectNode( node );

        // fit the graph
        $scope.graph.fit( '#' + node.id() )

      }
  }

  var showQTip = function(evt){

      var node = evt.cyTarget;

      var data = node.data();

      var qtipFormat = STUDIONET.GRAPH.qtipFormat(evt);
      
      qtipFormat.id = "qTip-" +  node.id();
      qtipFormat.content.text =  node.data('name');

      node.qtip(qtipFormat, evt);  
  
  }


  var onEdgeSingleClick = function(evt){
    
    console.log("Edge clicked", evt.cyTarget.data());
    //var edge = evt.cyTarget;
    //showEdgesModal(edge.data());
  }

  // Interaction on Single Click
  var onNodeSingleClick = function(evt, dbl){

        showQTip(evt);

        var node = evt.cyTarget;
        
        // select the node and highlight connections
        graph.selectNode(node);
        
        // preview
        if(node.data('db_data') == undefined){
          
          //console.log("Constructing new qtip");

          var data = node.data();

          contribution.getContribution(data.id).then(function(res){
              node.data('db_data', res.data);

              if(dbl)
                onNodeDoubleClick(evt);
          });

        }
        else{
          console.log("data already present");
        }        
  }

  // Graph Interaction for Double Click
  var onNodeDoubleClick = function(evt){

        var node = evt.cyTarget;

        $scope.graph.elements().removeClass('highlighted');
        
        var data = node.data();

        var nodeTree = [];
        nodeTree.push(data);

        // if data is already defined, donot load again - directly show modal
        // db_data stores additional-data from the server
        if(node.data('db_data')){
          showDetailsModal( nodeTree, node.id() );
        }
        else{
          console.warn("Data not defined for selected node;");
          onNodeSingleClick(evt, true);
        }
  }



  // Add graph interactions
  var addGraphInteractions = function(){

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
        else if( evt.cyTarget.isNode && evt.cyTarget.id() == graph.activeNode )
            onNodeDoubleClick(evt);
        else if( evt.cyTarget.isNode() )
            onNodeSingleClick(evt);
        else
          console.warn("Undefined Interaction");
      });

  }

  // Observe the Graph Service for Changes and register observer
  var updateGraph = function(){
      $scope.graph = graph.graph;
      highlightStateParams();
      addGraphInteractions();

      console.log("Graph Updated");
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

  var showDetailsModal = function(data, clickedContributionId) {

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


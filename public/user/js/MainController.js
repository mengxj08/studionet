angular.module('studionet')

.controller('MainController', ['$scope', '$stateParams', '$rootScope', 'ModalService',
                               'GraphService', 'users', 'profile', 'supernode', 
                               function($scope, $stateParams, $rootScope, ModalService, GraphService, users, profile, supernode){


  // --------------- socket connection message handling
  socket.on('node_created', function (node) {
      node.type = node.contentType;
      GraphService.addNewNode(node);

      if(node.createdBy == profile.user.id)
        profile.getActivity();

  });

  socket.on('node_updated', function (node) {
     node.type = node.contentType;
     GraphService.updateNodeInGraph(node);
     console.log("update node", node);
  });

  socket.on('node_deleted', function (node) {
     GraphService.removeNode(node);
  });


  socket.on('node_rated', function (data) {

    console.log(data);

    // update the graph colors
    $scope.graph.getElementById(data.id).data('rating',  data.rating);
    $scope.graph.getElementById(data.id).data('rateCount',  data.rateCount);
    $scope.graph.getElementById(data.id).data('totalRatings',  data.totalRatings);

    profile.getActivity();

  });

  socket.on('node_viewed', function (data) {
    
    $scope.graph.getElementById(data.id).flashClass('glow', 500)
    for(i = 0; i < 30; i++){
      setTimeout(function(){
        $scope.graph.getElementById(data.id).flashClass('glow', 500)
      }, 1000*i)
    
    }

    profile.getActivity();

  });


  // -------------- constants and declarations
  $scope.me = profile.user;


  // ---- Displays message in the message-container
  // todo: remove message id reference
  var showMessage = function(msg){

      $scope.message = msg;

      for(i=0;i<5;i++) {
        $('#message').fadeTo('slow', 0.5).fadeTo('slow', 1.0);
      }

      setTimeout(function(){
        $scope.message = "";
        $scope.$apply();
      }, 7000)
  
  }



  // ----------------- Graphs
  var graph_container = angular.element('#cy')[0];
  // First Initialization of the graph on page-refresh
  $scope.graphInit = function(){  

      var graphObject = {
        threshold : 20, 
        onMouseOver: showQTip,
        onEdgeSingleClick: onEdgeSingleClick, 
        onCanvasClick: function(){ GraphService.removeAdditionalStyles() },
        onNodeSingleClick: function(evt){ showQTip(evt); GraphService.selectNode(evt.cyTarget); },
        onNodeDoubleClick : function(evt){
                                  var node = evt.cyTarget;
                                  $scope.graph.elements().removeClass('highlighted');
                                  showDetailsModal( node );
                            }
      }

      GraphService.getGraph( graph_container, graphObject );  
  }


  // ------------- Zooming & Nav Controls
  $scope.zoomLevel = "Calibrating...";
  var updateZoom = function(){
    if($scope.graph){
      $scope.zoomLevel = (100*$scope.graph.zoom()).toPrecision(4);
      $scope.$apply();
    }
  }
  setTimeout(updateZoom, 1000);
  graph_container.addEventListener("wheel", updateZoom);

  $scope.resetGraph = function(){  GraphService.graph.fit();  }


  // Highlight any state params
  var highlightStateParams = function(){

      // highlight node, if any in route params
      if($stateParams.contributionId && $scope.graph.getElementById( $stateParams.contributionId ) ){

        var node = $scope.graph.getElementById( $stateParams.contributionId)
        GraphService.selectNodePermanent( node );

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
      qtipFormat.content.text =  node.data('title') + "<br>- " + ( (auth.nickname !=null && auth.nickname.length) ? auth.nickname : auth.name)

      node.qtip(qtipFormat, evt);  

  }

  var onEdgeSingleClick = function(evt){
  }

  // Observe the Graph Service for Changes and register observer
  var updateGraph = function(){
      $scope.graph = GraphService.graph;
      highlightStateParams();
      for(var i=0; i < profile.activity.length; i++ ){
        if(profile.activity[i].type == "VIEWED" || profile.activity[i].type == "CREATED")
          $scope.graph.getElementById(profile.activity[i].end).addClass('read');

      }
  };
  GraphService.registerObserverCallback(updateGraph);






  // ---------------- Filters
  $scope.filters = [];
  $scope.matchingNodes = [];

  // when message received
  $scope.$on( BROADCAST_MESSAGE, function(event, args) {
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
    $rootScope.$broadcast(BROADCAST_CLEAR_FILTER, { 'code': code, 'value': optional_value });
  }



  // ------- Modals
  // Edges Modal
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


  // View Modal
  $scope.viewMode = false;
  $scope.$on( BROADCAST_VIEWMODE_OFF, function(event, args) {
    $scope.viewMode = false;
  });
  var showDetailsModal = function(data, clickedContributionId) {

      $scope.viewMode = true;

      // show the details modal
      ModalService.showModal({
          templateUrl: "/user/components/nodes/view.html",
          controller: "NodeController",
          scope: $scope
      }).then(function(modal) {

          modal.scope.setData(data, clickedContributionId);

          modal.element.modal({
            backdrop: 'static'
          });
          
      });

  };


}])


angular.module('studionet')

.controller('MainController', ['$scope', '$stateParams', '$rootScope', 'ModalService',
                               'GraphService', 'users', 'profile', 'supernode', 
                               function($scope, $stateParams, $rootScope, ModalService, GraphService, users, profile, supernode){


  // --------------- socket connection message handling
  socket.on('node_created', function (data) {
      console.log(data);
  });

  socket.on('node_rated', function (data) {
    
    // update the graph colors
    // very messy code - change
    $scope.graph.getElementById(data.id).data('rating',  data.rating);

    if($scope.graph.getElementById(data.id).data('db_data') !== undefined)
      $scope.graph.getElementById(data.id).data('db_data').rating = data.rating;

  });

  socket.on('node_viewed', function (data) {
    
    $scope.graph.getElementById(data.id).flashClass('glow', 500)
    for(i = 0; i < 30; i++){
      setTimeout(function(){
        $scope.graph.getElementById(data.id).flashClass('glow', 500)
      }, 1000*i)
    
    }

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
  // First Initialization of the graph on page-refresh
  $scope.graphInit = function(){  
    GraphService.getGraph(angular.element('#cy')[0]);  
  }

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
      qtipFormat.content.text =  node.data('name') + "<br>- " + ( (auth.nickname !=null && auth.nickname.length) ? auth.nickname : auth.name)

      node.qtip(qtipFormat, evt);  
  }

  var onEdgeSingleClick = function(evt){
  }

  // Interaction on Single Click
  var onNodeSingleClick = function(evt, dbl){

        var node = evt.cyTarget;

        showQTip(evt);
        
        // select the node and highlight connections
        GraphService.selectNode(node);


  }

  // Graph Interaction for Double Click
  var onNodeDoubleClick = function(evt){

        console.log("Double click");

        var node = evt.cyTarget;

        $scope.graph.elements().removeClass('highlighted');
        
        // if data is already defined, donot load again - directly show modal
        // db_data stores additional-data from the server
        if(node.data('db_data')){

          node.addClass('read');

          if($scope.viewMode == false)
            showDetailsModal( node );
          else
            console.warn("Modal already showing");

        }
        else{
          console.warn("Data not defined for selected node;");

          // check again after 400ms
          setTimeout(function(){
            if(node.data('db_data') !== undefined){
              node.addClass('read');
              showDetailsModal( node );
            }
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
      //myGraphWorker.postMessage([ threshold, supernode.contribution])
      STUDIONET.GRAPH.draw_graph($scope.graph, threshold, supernode.contribution);


      // mark the read nodes
      for(var i=0; i < profile.activity.length; i++ ){
        if(profile.activity[i].type == "VIEWED" || profile.activity[i].type == "CREATED")
          $scope.graph.getElementById(profile.activity[i].end).addClass('read');

      }

      // remove the comments
      /*$scope.comments = $scope.graph.remove("node[type = 'comment']");
      for(var n=0; n < $scope.graph.nodes().length; n++){
        var node = $scope.graph.nodes()[n]
        node.data('comments', []);
        for(var i=0; i < node.incomers().edges().length; i++){
            var replyLink = node.incomers().edges()[i];
            if(replyLink.data('name') == "COMMENT_FOR"){
              var commentId = replyLink.source().id();
              node.data().comments.push(commentId);
            }
        }
      }*/
      

    
      // Display the entire node name
      $scope.graph.on('mouseover', 'node', function(evt){
          showQTip(evt);
      });

      $scope.graph.on('tap', function(evt){
        if( evt.cyTarget.isEdge && evt.cyTarget.isEdge() )
            onEdgeSingleClick(evt);
        else if( !( (evt.cyTarget.isNode && evt.cyTarget.isNode()) ) ){
            GraphService.removeAdditionalStyles();
        }
        else if( evt.cyTarget.isNode && evt.cyTarget.id() == GraphService.activeNode ){
            onNodeDoubleClick(evt);
        }
        else if( evt.cyTarget.isNode() ){
            onNodeSingleClick(evt);
        }
        else
          console.warn("Undefined Interaction");
      });
  }

  // Observe the Graph Service for Changes and register observer
  var updateGraph = function(){
      $scope.graph = GraphService.graph;
      highlightStateParams();
      addGraphInteractions();
  };
  GraphService.registerObserverCallback(updateGraph);




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


angular.module('studionet')

/*
 *  Main Contribution Graph Page
 * 
 */
.controller('ContributionsCtrl', ['$scope', 'supernode', 'users', 'Upload', '$timeout', 'ModalService', 'contributions', 'contribution', 'tags', function($scope, supernode, users, Upload, $timeout, ModalService, contributions, contribution, tags){

  $scope.simple = true;
  $scope.filterStatus = false;  // default

  $scope.tags = tags.tags;

  //$scope.user = profile.user;
  $scope.users = users.usersById();   // needed for hover to get user name - fix later

  var activeNode = null;
  var rootnode = supernode.contribution;


  /* 
   * Toggle Filter
   */
  $scope.toggleFilter = function(){
    
    console.log(angular.element('#filterPanel').scope().filterVisible)

    angular.element('#filterPanel').scope().filterVisible = !angular.element('#filterPanel').scope().filterVisible;

    $scope.filterStatus = angular.element('#filterPanel').scope().filterVisible;
    
    if(!$scope.filterStatus){
      angular.element('#filterPanel').scope().clearFilter();
      $scope.graphInit();
    }
  }

  /*
   * Zooming Code
   */
  $scope.zoomLevel = "Calibrating...";
  var updateZoom = function(){
    if($scope.graph){
      $scope.zoomLevel = (100*$scope.graph.zoom()).toPrecision(4);
      $scope.$apply();
    }
  }
  setTimeout(updateZoom, 1000);
  document.getElementById("cy").addEventListener("wheel", updateZoom);



  /*
   * Graph Styles
   */
  var removeAdditionalStyles = function(){
      $scope.graph.batch(function(){

          $scope.graph.elements()
            .removeClass('highlighted')
            .removeClass('selected')
            .removeClass('faded');
      });          

      activeNode = null;
  }

  /*
   * Graph selection
   */
  $scope.highlightNode = function( node ){

    var node = node; 

    if( node.isNode == undefined )
      node = $scope.graph.getElementById(node);

    $scope.graph.batch(function(){
        $scope.graph.elements()
          .removeClass('highlighted')
          .removeClass('selected')
          .addClass('faded');

          node.removeClass('faded')
              .addClass('selected');
          
          node.predecessors().removeClass('faded')
                             .addClass('highlighted');
          
          node.successors().removeClass('faded')  
                           .addClass('highlighted');
    });

  }


  // function to generate qtip content
  var generateQtipContent = function(extra_data){

        var profile = "<b>" +  angular.element($('.graph-container')).scope().users[ extra_data.createdBy ].name  + "</b>";
        var date = "<br><em>" + (new Date(extra_data.dateCreated)).toString().substr(0, 10) + "</em>" ;
        var attachments = "<br><br><b><em>" + extra_data.attachments.length + " attachments</em></b>";
        var textSnippet = "<br>" + extra_data.body.substr(0,300);

        return profile + date + ( (extra_data.attachments[0].id == null) ? " " : attachments )  + textSnippet;                      
                      
  }

  /*
   *    Graph Creation & Interactions
   */
  $scope.graphInit = function(graph_data, node_id){

      // if graph_data exists with no nodes, return;
      if(arguments[0] != undefined && graph_data.nodes.length == 0)
        return;

      // takes either data from filters or contribution.graph data
      $scope.graph = STUDIONET.GRAPH.makeGraph( graph_data || contributions.graph, 'cy' );
      var cy = $scope.graph;
      
      if(arguments[1] != undefined)
        $scope.highlightNode(node_id);

      //updateZoom();

      if(!$scope.simple){
          cy.on('mouseover','node', function(evt){

              var node = evt.cyTarget;

              /* 
               *  Highlight connections
               * 
               */
              $scope.highlightNode(node);

              /*
               * Get node data and construct qTip
               */
              var data = node.data();

              var qtipFormat = STUDIONET.GRAPH.qtipFormat(evt);

              if(data.id == supernode.contribution){
                  qtipFormat.content.title = "Studionet Root Node";
                  qtipFormat.content.text = "This is the root node for Studionet."; 
                  
                  node.qtip(qtipFormat, evt); 
              }
              else{

                // fix me
                var route = "/api/" + data.type + "s/" + data.id;
                $.get( route , function( extra_data ) {


                      qtipFormat.content.title =  extra_data.title;
                      qtipFormat.content.text = generateQtipContent(extra_data);

                      node.qtip(qtipFormat, evt);   
                      node.data('db_data', extra_data);

                });
              }
          });

          cy.on('mouseout','node', function(evt){
              cy.elements().removeClass('faded');
          });       
      }
      else{

        // remove supernode
        cy.getElementById(supernode.contribution).remove();

        // Show whole name of node 
        cy.on('mouseover','node', function(evt){
            cy.elements().removeClass('fullname');
             evt.cyTarget.addClass('fullname');
        });

        cy.on('mouseout','node', function(evt){
            cy.elements().removeClass('fullname');
        });

        
        cy.on('tap', function(evt){

            // if clicked on neither edge nor node
            if( !( evt.cyTarget.isNode && evt.cyTarget.isNode() ) ){
                removeAdditionalStyles();
            }
            else if( evt.cyTarget.isNode && evt.cyTarget.id() == activeNode ){

                    console.log("Selected Node Clicked Again");

                    //This is the "tapping" behavior onto each node to trigger the contribution view
                    cy.elements().removeClass('highlighted');
                    var node = evt.cyTarget;
                    var data = node.data();
                    var directlyConnected = node.neighborhood();
                    node.addClass('selected');
                    directlyConnected.nodes().addClass('highlighted');
                    node.connectedEdges().addClass('highlighted');

                    var nodeTree = [];
                    nodeTree.push(data);

                    // if data is already defined, donot load again - directly show modal
                    // db_data stores additional-data from the server
                    if(node.data('db_data')){
                      angular.element($('.graph-container')).scope().showDetailsModal( nodeTree, node.data('id'));
                    }
                    else{
                      
                      // fix later - repeated code
                      console.warn("Data not defined for double-clicked node;");
                      contribution.getContribution(node.id()).then(function(res){
                            
                            // define qtip first
                            var extra_data = res.data;

                            qtipFormat.content.title =  extra_data.title;
                            qtipFormat.content.text = generateQtipContent(extra_data);

                            // append qtip and extra data
                            node.data('qtip', qtipFormat);
                            node.data('db_data', extra_data);

                            node.qtip(qtipFormat, evt);   

                            // open details modal
                            angular.element($('.graph-container')).scope().showDetailsModal( nodeTree, node.data('id'));
                            
                      });

                    }

                    /*
                     * Removing slow recursive for simple version
                     * 
                     */
                    /*if(data.type == 'contribution'){
                          var predecessors = node.predecessors();
                          var successors = node.successors();
                          var nodeTree = [];
                          for(var i = predecessors.nodes().length - 1; i >= 0; i--){
                            //Recursively get edges (and their sources) coming into the nodes in the collection (i.e. the incomers, the incomers' incomers, ...)
                            var nodeItem = predecessors.nodes()[i];
                            if(nodeItem.data().type == 'contribution'){
                              nodeTree.push(nodeItem.data());
                              console.log(nodeItem.data());
                            }
                          }
                          nodeTree.push(data);
                          successors.nodes().forEach(function(nodeItem){
                            //Recursively get edges (and their targets) coming out of the nodes in the collection (i.e. the outgoers, the outgoers' outgoers, ...).
                            if(nodeItem.data().type == 'contribution'){
                              nodeTree.push(nodeItem.data());
                              console.log(nodeItem.data());
                            }
                          })

                          var RecursiveGetData = function(index){
                            var route = "/api/" + nodeTree[index].type + "s/" + nodeTree[index].id;
                            $.get( route , function(result) {
                                //console.log("test on clicking onto a contribution");
                                nodeTree[index].db_data = result;
                                if(index == nodeTree.length - 1){
                                  angular.element($('.graph-container')).scope().showDetailsModal(nodeTree, data.id);

                                  //Mouse out the clicked node once it enters the modal page
                                  cy.elements().css({ content: " " });
                                  cy.elements().removeClass('highlighted');
                                  cy.elements().removeClass('selected');

                                  if(cy.$('node:selected')){
                                    $('#content-block-hover').html("");
                                    $('#content-block-hover').hide();    
                                  }
                                }
                                else{
                                  RecursiveGetData(++index);
                                }
                            });
                          };

                          RecursiveGetData(0);
                    } */

            }
             // if unselected node
            else if( evt.cyTarget.isNode() ){

                console.log("New Node Clicked");
                activeNode = evt.cyTarget.id();

                var node = evt.cyTarget;

                $scope.highlightNode(node);

                // preview
                if(node.data('qtip') == undefined){
                  
                  //console.log("Constructing new qtip");

                  var qtipFormat = STUDIONET.GRAPH.qtipFormat(evt);
                  var data = node.data();

                  contribution.getContribution(data.id).then(function(res){

                        var extra_data = res.data;

                        qtipFormat.content.title =  extra_data.title;
                        qtipFormat.content.text = generateQtipContent(extra_data);

                        node.data('qtip', qtipFormat);
                        node.data('db_data', extra_data);

                        node.qtip(qtipFormat, evt);   
                  });

                }
                else{
                  //console.log("qtip already defined");
                  node.qtip(node.data('qtip'), evt);
                }

            }
            else{

              console.log("Undefined Interaction");
            
            }
        
        })


      }

  }

  /* 
   *    Nav Controls
   */
  $scope.resetGraph = function(){
    /*  $scope.graph.layout().stop(); 
      layout = $scope.graph.elements().makeLayout({ 'name': 'cola'}); 
      layout.start();   */
      $scope.graph.fit();
      removeAdditionalStyles();
  }

  /*
   *
   *  Contribution Creation
   *
   */
  $scope.createNewContribution = function(){

      ModalService.showModal({

        templateUrl: "/user/templates/createContributionModal.html",
        controller: "CreateContributionCtrl",
        scope: $scope

      }).then(function(modal) {

          // activate modal
          modal.element.modal({ backdrop: 'static' });

          /// set data
          //modal.scope.setData(data,clickedContributionId);
        
      });

  } 


  /*
   *
   *  Contribution Details
   *
   */
  $scope.showDetailsModal = function(data, clickedContributionId) {
      ModalService.showModal({

        templateUrl: "/user/templates/home.graphView.modal.html",
        controller: "DetailsModalCtrl",
        scope: $scope

      }).then(function(modal) {
        modal.element.modal({
          backdrop: 'static'
          // keyboard: false
        });

        /// set data
        modal.scope.setData(data,clickedContributionId);
        //modal.scope.getAllContributions(contributions.contributions);
        //modal.scope.refresh();
        
        // modal.close.then(function(result) {
        //   //$scope.complexResult  = "Name: " + result.name + ", age: " + result.age;
        // });
      });
  };


}])


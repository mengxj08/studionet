/*
 *  Cytoscape Styles
 */
var MODULE_SHAPE = "rectangle";
var USER_SHAPE = "ellipse"
var CONTRIBUTION_SHAPE = "ellipse"

var MODULE_WIDTH = 15, MODULE_HEIGHT = 15;
var USER_WIDTH = 20, USER_HEIGHT = 20; 
var CONTRIBUTION_WIDTH = 30, CONTRIBUTION_HEIGHT = 30;

var MODULE_COLOR = "#FB95AF";
var USER_COLOR = "#DE9BF9";
var CONTRIBUTION_COLOR = "#D02F2F";

var EDGE_DEFAULT_COLOR = "#B7B6B6";
var EDGE_SELECTED_COLOR = "blue";
var EDGE_DEFAULT_STRENGTH = 3;
var EDGE_DEFAULT_WEIGHT = 3;


var COLA_GRAPH_LAYOUT = { name : 'cola', padding: 10 };

var GRID_GRAPH_LAYOUT = { name : 'grid' };
var DAGRE_GRAPH_LAYOUT = { name : 'dagre' };
var CIRCLE_GRAPH_LAYOUT = { name : 'circle' };
var COSE_GRAPH_LAYOUT = { name: 'cose',
                          padding: 15, 
                          randomize: true};

var CONCENTRIC_GRAPH_LAYOUT = {  name: 'concentric', 
        concentric: function( node ){
          return node.degree();
        },
        levelWidth: function( nodes ){
          return 1;
        }};

/*
 * Cytoscape Specific Styles
 */
var graph_style = {
      
      container: document.getElementById('cy'),

      ready: function(){
                          window.cy = this;

                          //giddy up
                        },
      
      layout: COLA_GRAPH_LAYOUT,
      
      hideLabelsOnViewport: false,
      
      style: 
        cytoscape.stylesheet()
          
          .selector('node')
            .css({
              'background-color': 'data(faveColor)',
              'shape': 'data(faveShape)',
              'width': 'data(width)', 
              'height': 'data(height)',   // mapData(property, a, b, c, d)  => specified range a, b; actual values c, d
              'text-valign': 'center',
              'font-size':'15%',
              'border-color': 'black',
              'color': '#222',
              'content' : 'data(label)'
            })
           
          .selector('.selected')
            .css({
              'border-width': 3.5,
              'border-color': '#333',
              'width': 40, 
              'height': 40,
              'font-size': '15%',
              'background-color': 'blue',
            })
          
          .selector('edge')
            .css({
              'curve-style': 'bezier',
              'width': 'mapData(weight, 0.1, 3, 1, 7)', 
              'target-arrow-shape': 'triangle',
              'line-color': '#333',
              'source-arrow-color': 'data(faveColor)',
              //'content' : 'data(label)',
              'font-size':'10%',
              'color': 'data(faveColor)',
              'edge-text-rotation': 'autorotate',
              'target-arrow-color': 'data(faveColor)'
            })

          .selector('edge')
            .style({

            })
            
          
          .selector('.faded')
            .css({
              'opacity': 0.75,
              'text-opacity': 0.25
            })
          
          .selector('.highlighted')
            .css({
              'line-color': 'green',
              'target-arrow-color':'green',
              'border-width': 3.5              
            })
            .style({
              'content': 'data(label)',
              'color': '#222',
              'line-color': 'data(faveColor)'
            })

          .selector('.searched')
            .css({
              'line-color': 'blue',
              'target-arrow-color':'black',
              'background-color': 'blue',
              'border-width': 0.5,
              'border-color': '#333',
              'width': 'data(width) + 10', 
              'height': 'data(height) + 10'              
            })

}

/*
 * Converts normal node from backend into cytoscape-specific format
 */
var createGraphNode = function(node){

    var data = node;

    var id = angular.element($('.graph-container')).scope().user.id;

    if(node.type=="module"){
          node.faveShape = MODULE_SHAPE;
          node.faveColor = MODULE_COLOR;
          node.width = MODULE_WIDTH;
          node.height = MODULE_HEIGHT;
          node.icon = 'url(./img/module1.png)'//'url(../../img/worldwide.svg)';
    }
    else if(node.type=="user"){ 
          node.faveShape = USER_SHAPE;
          node.faveColor = USER_COLOR;
          node.width = USER_WIDTH;
          node.height = USER_HEIGHT;
          
          if(node.id == id){
            node.icon = 'url(https://encrypted-tbn3.gstatic.com/images?q=tbn:ANd9GcQiILryEowDWzJ29q0LwIZ6jwddVyfT0Tn1Dp0lIRI4Vuwhy4u3kg)'
          }
          else{
             // logged in user image - sakshi
            node.icon = 'url(./img/user-icon.jpg)';
          }
    }
    else if(node.type=="contribution"){

          node.faveShape = CONTRIBUTION_SHAPE;
          node.faveColor = CONTRIBUTION_COLOR;
          node.width = CONTRIBUTION_WIDTH;
          node.height = CONTRIBUTION_HEIGHT;

          if(node.name == 'StudioNET'){
             node.width = CONTRIBUTION_WIDTH + 10;
             node.height = CONTRIBUTION_HEIGHT + 10;
             node.faveColor = "#222";
          }
    }
    else {
          node.faveShape = CONTRIBUTION_SHAPE;
          node.faveColor = CONTRIBUTION_COLOR;
          node.width = CONTRIBUTION_WIDTH;
          node.height = CONTRIBUTION_HEIGHT;
          node.icon = 'url()' //'url(../../img/zoom-in.svg/)';
    }
   

    return  { data: node };
}

/*
 * Converts normal edge from backend into cytoscape-specific format
 */
var createGraphEdge = function(edge){

    edge.strength = EDGE_DEFAULT_STRENGTH;
    edge.faveColor = EDGE_DEFAULT_COLOR;
    edge.weigth = EDGE_DEFAULT_WEIGHT;
    edge.label = edge.name;

    if(edge.name == "QUESTION_FOR"){
      edge.faveColor = "red";
      edge.label = "QUESTION";
    }
    else if(edge.name == "ANSWER_FOR"){
      edge.faveColor = 'green';
      edge.label = "ANSWER"
    }
    else if(edge.name == "RESOURCE_FOR"){
      edge.faveColor = 'purple';
      edge.label = "RESOURCE"
    }
    else if(edge.name == "COMMENT_FOR"){
      edge.faveColor = 'blue';
      edge.label = "COMMENT"
    }

    var t = edge.target; 
    edge.target = edge.source;
    edge.source = t;
    // invert


    return { data: edge };

}

/*
 * Composes the hover-box according to node type
 */
var createHoverBox = function( node, extra ){
    
    var html_content = $('<div></div>').addClass(node.type);
    
    var heading = $('<h4></h4>').html(node.name || node.title);
    html_content.append(heading);
   

    if(node.type == "module"){
      var stat1 = $('<div></div>').addClass('stats').html('Users <br> 243');
      statsContainer.append(stat1);
      var stat2 = $('<div></div>').addClass('stats').html('Contributions <br> 10');
      statsContainer.append(stat2);
    }
    else if(node.type == "user"){
      var stat1 = $('<div></div>').addClass('stats').html('Last Active <br> 24-1-2017');
      statsContainer.append(stat1);
      var stat2 = $('<div></div>').addClass('stats').html('Contributions <br> 10');
      statsContainer.append(stat2);
    }
    else if(node.type == "contribution"){

      var author = $('<p class=\'hover-content\'></p>').html("Author: " + angular.element($('.graph-container')).scope().users[ extra.createdBy ].name);
      var date = new Date(extra.dateCreated);
      var lastUpdated = $('<p></p>').html( date.toString().substr(0, 10) );
      var mini_content = $('<p class=\'hover-content\'></p>').html(extra.body.substr(0, 300) + "...");

        
      html_content.append(author);
      html_content.append(lastUpdated);
      html_content.append(mini_content);
    }


    return html_content;

}

/*
 * Makes the actual graph and defines functionality on the nodes and edges
 */
var makeGraph = function(dNodes, dEdges){

    console.log("Making Graph");

    // if cytoscape canvas is defined, assign that
    if(arguments[2] != undefined)
      graph_style.container = document.getElementById(arguments[2]);

    graph_style.elements = {
        nodes: dNodes.map( function(node){ return createGraphNode(node) } ), 
        edges: dEdges.map( function(edge){ return createGraphEdge(edge) } )
    }

    //graph_style.layout = eval($("input[name='layout-radio']:checked").val());
    graph_style.layout = COLA_GRAPH_LAYOUT;

    cy = cytoscape( graph_style );

    

    /*
     *
     *  Show hover-box on mouse in
     * 
     */
    cy.on('mouseover','node', function(evt){


      var qtipFormat = {
           content: { },
           
           show: {
              evt: evt.type,
              solo: true,
              ready: true
           },
           
           hide: {
              evt: 'mouseout',
              delay: 0
           },
           
           position: {
            my: 'top left',
            at: 'center center'
           },
           
           events: {
                //this hide event will remove the qtip element from body and all assiciated events, leaving no dirt behind.
                hide: function(event, api) {
                    api.destroy(true); // Destroy it immediately
                }
           },
           
           style: {
            classes: 'qTipClass',
            width: 300 // Overrides width set by CSS (but no max-width!)
            //height: 100 // Overrides height set by CSS (but no max-height!)
         }
      }


      /* 
       *  Highlight connections
       * 
       */
      cy.elements().removeClass('highlighted');
      cy.elements().removeClass('selected');

      var node = evt.cyTarget;
      var data = node.data();
      var directlyConnected = node.neighborhood();
      node.addClass('selected');
      directlyConnected.nodes().addClass('highlighted');
      node.connectedEdges().addClass('highlighted');

            
      if(data.name == "StudioNET"){
       
        qtipFormat.content.title = "Studionet Root Node";
        qtipFormat.content.text = "This is the root node for Studionet."; 
        
        node.qtip(qtipFormat, evt); 
        return;
      }


      var route = "/api/" + data.type + "s/" + data.id;
      $.get( route , function( extra_data ) {


            var content = "<b>" +  angular.element($('.graph-container')).scope().users[ extra_data.createdBy ].name  + "</b>" +
                          "<br><em>" + (new Date(extra_data.dateCreated)).toString().substr(0, 10) + "</em>" +
                          "<br>" + extra_data.body.substr(0,300)

            qtipFormat.content.title = extra_data.title;
            qtipFormat.content.text = content;

            node.qtip(qtipFormat, evt);   
      });


    });


    cy.on('tap', 'node', function(evt){

      cy.elements().removeClass('highlighted');
      var node = evt.cyTarget;
      var data = node.data();
      var directlyConnected = node.neighborhood();
      node.addClass('selected');
      directlyConnected.nodes().addClass('highlighted');
      node.connectedEdges().addClass('highlighted');

      var x = evt.cyPosition.x;
      var y = evt.cyPosition.y;

      if(data.type == 'contribution'){
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
      }
    });

    
}


var refreshGraph = function(data){

    if(arguments[0]){
      console.log("Filtered graph")
      makeGraph(data.nodes, data.links);
    }    
    else{
        console.log("Default graph")
        // API Request for Entire Graph - default
        $.get( "/graph/all", function( data ) {

            makeGraph( 
                data.nodes/*.map( function(node){ return createGraphNode(node) } )*/, 
                data.links/*.map( function(edge){ return createGraphEdge(edge) } ) */           
            );

            resizeNodes(cy);

            cy.minZoom(0.5);
            cy.maxZoom(1.5);

        })


    }

}



/*
 *  Takes a graph and resizes the nodes according to incoming and outgoing links
 */
var resizeNodes = function( graph ){

  for(var i=0; i < graph.nodes().length; i++){

    //console.log(cy.nodes()[i].data().name == "StudioNET");
    if( cy.nodes()[i].data().name == "StudioNET")
      continue;


    if( cy.nodes().id()[i] != "10"){
      var conn = cy.nodes()[i].incomers().length + cy.nodes()[i].outgoers().length
      cy.nodes()[i].css({ 
            'width': 10+conn*3, 
            'height': 10+conn*3,   // mapData(property, a, b, c, d)  => specified range a, b; actual values c, d
      })        
    }

  } 



}



// On document ready
$(document).ready(function(){
    refreshGraph(); 
});



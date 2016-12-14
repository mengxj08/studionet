/*
 *  Cytoscape Styles
 */
var SUPERNODE_SHAPE = "ellipse";
var SUPERNODE_WIDTH = 45, SUPERNODE_HEIGHT = 45;
var SUPERNODE_COLOR = "#000";


var MODULE_SHAPE = "rectangle";
var USER_SHAPE = "ellipse"
var CONTRIBUTION_SHAPE = "ellipse"

var MODULE_WIDTH = 15, MODULE_HEIGHT = 15;
var USER_WIDTH = 20, USER_HEIGHT = 20; 
var CONTRIBUTION_WIDTH = 15, CONTRIBUTION_HEIGHT = 15;

var MODULE_COLOR = "#FB95AF";
var USER_COLOR = "#DE9BF9";
var CONTRIBUTION_COLOR = "#D02F2F";

var EDGE_DEFAULT_COLOR = "#B7B6B6";
var EDGE_SELECTED_COLOR = "blue";
var EDGE_DEFAULT_STRENGTH = 3;
var EDGE_DEFAULT_WEIGHT = 3;

/*
 * Layout options
 */
var COLA_GRAPH_LAYOUT = { name : 'cola', padding: 10 };
var GRID_GRAPH_LAYOUT = { name : 'grid' };
var DAGRE_GRAPH_LAYOUT = { name : 'dagre' };
var CIRCLE_GRAPH_LAYOUT = { name : 'circle' };
var COSE_GRAPH_LAYOUT = { name: 'cose',
                          padding: 15, 
                          randomize: true };
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
              'shape': 'data(faveShape)',
              'width': 'data(width)', 
              'height': 'data(height)',   // mapData(property, a, b, c, d)  => specified range a, b; actual values c, d
              'text-valign': 'bottom',
              'font-size':'1em',
              'font-weight': '300',
              'background-color': 'data(faveColor)',
              'border-color': 'data(faveColor)',
              'content' : 'data(name)',
              'text-wrap' : 'wrap',
              'text-max-width': '100',
              'text-valign': 'bottom',
            })
           
          .selector('.selected')
            .css({
              'border-width': 3.5,
              'border-color': '#333',
              'width': 20, 
              'height': 20,
              'font-size': '15%'
            })
          
          .selector('edge')
            .css({
              'curve-style': 'bezier',
              'width': 'mapData(weight, 0.1, 3, 1, 7)', 
              'target-arrow-shape': 'triangle',
              'line-color': 'data(faveColor)',
              'source-arrow-color': 'data(faveColor)',
              //'content' : 'data(name)',
              'font-size':'7%',
              'color': '#222',
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
              'background-color': 'blue',
              'border-width': 3.5              
            })
            .style({
              'content': 'data(label)'
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
    
    //console.log( id);
    if( node.superNode ){
          node.faveShape = SUPERNODE_SHAPE;
          node.faveColor = SUPERNODE_COLOR;
          node.width = SUPERNODE_WIDTH;
          node.height = SUPERNODE_HEIGHT;      
    }
    else if(node.type=="module"){
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
    edge.label = edge.type;

    return { data: edge };

}

/*
 * Makes the actual graph and defines functionality on the nodes and edges
 */
var makeGraph = function(data, graphContainer, graphFn, edgeFn){

    console.log("In graph-helper.js");

    // if cytoscape canvas is defined, assign that
    if(arguments[1] != undefined)
      graph_style.container = document.getElementById(arguments[1]);

    if(arguments[2] != undefined)
      createGraphNode = graphFn; 

    if(arguments[3] != undefined)
      createGraphEdge = edgeFn;

    graph_style.elements = {
        nodes: data.nodes.map( function(node){ return createGraphNode(node) } ), 
        edges: data.links.map( function(edge){ return createGraphEdge(edge) } )
    }

    graph_style.layout = COLA_GRAPH_LAYOUT;

    cy = cytoscape( graph_style );

    var winWidth = window.innerWidth/2;
    var winHeight = window.innerHeight/2;

    return cy;
    
}
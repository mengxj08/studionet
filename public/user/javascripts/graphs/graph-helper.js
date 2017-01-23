var STUDIONET = {};
STUDIONET.GRAPH = {};

// Spinner
STUDIONET.GRAPH.spinner = {
    lines: 13 // The number of lines to draw
  , length: 28 // The length of each line
  , width: 2 // The line thickness
  , radius: 42 // The radius of the inner circle
  , scale: 1 // Scales overall size of the spinner
  , corners: 1 // Corner roundness (0..1)
  , color: '#ddd' // #rgb or #rrggbb or array of colors
  , opacity: 0.25 // Opacity of the lines
  , rotate: 0 // The rotation offset
  , direction: 1 // 1: clockwise, -1: counterclockwise
  , speed: 1 // Rounds per second
  , trail: 60 // Afterglow percentage
  , fps: 20 // Frames per second when using setTimeout() as a fallback for CSS
  , zIndex: 2e9 // The z-index (defaults to 2000000000)
  , className: 'spinner' // The CSS class to assign to the spinner
  , top: '50%' // Top position relative to parent
  , left: '50%' // Left position relative to parent
  , shadow: false // Whether to render a shadow
  , hwaccel: false // Whether to use hardware acceleration
  , position: 'absolute' // Element positioning
}

/*
 * qTip format for hover functions
 *
 */
STUDIONET.GRAPH.qtipFormat = function(evt){
  return {
     content: { title: "", text:"", button: 'Close'  },
     show: {
        evt: evt.type,
        ready: true,
        solo: true
     },
     hide: {
        evt: 'mouseout'
     },
     position: {
        //container: $('div.graph-container'),
        my: 'top left',
        at: 'bottom right'
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
     }
  }
}

/*
 * Layout options
 */
var COLA_GRAPH_LAYOUT = { name : 'cola', padding: 10 };
var GRID_GRAPH_LAYOUT = { name : 'grid', padding: 40 };
var DAGRE_GRAPH_LAYOUT = { name : 'dagre' };
var CIRCLE_GRAPH_LAYOUT = { name : 'circle' };
var COSE_GRAPH_LAYOUT = { 
                  name: 'cose', padding: 10, randomize: true 
                };
var CONCENTRIC_GRAPH_LAYOUT = {  name: 'concentric', 
                                  concentric: function( node ){
                                    return node.predecessors();
                                  },
                                  levelWidth: function( nodes ){
                                    return 50;
                                  }};


var COSE_GRAPH_LAYOUT = {
  name: 'cose',

  // Called on `layoutready`
  ready: function(){ },

  // Called on `layoutstop`
  stop: function(){   /*reposition() */ },

  // Whether to animate while running the layout
  animate: true,

  // The layout animates only after this many milliseconds
  // (prevents flashing on fast runs)
  animationThreshold: 250,

  // Number of iterations between consecutive screen positions update
  // (0 -> only updated on the end)
  refresh: 20,

  // Whether to fit the network view after when done
  fit: true,

  // Padding on fit
  padding: 10,

  // Constrain layout bounds; { x1, y1, x2, y2 } or { x1, y1, w, h }
  boundingBox:  undefined,

  // Randomize the initial positions of the nodes (true) or use existing positions (false)
  randomize: true,

  // Extra spacing between components in non-compound graphs
  componentSpacing: function( node ){ return 300 + node.predecessors().length*100; },

  // Node repulsion (non overlapping) multiplier
  nodeRepulsion: function( node ){ return node.predecessors().length*1000000; },

  // Node repulsion (overlapping) multiplier
  nodeOverlap: 50000,

  // Ideal edge (non nested) length
  idealEdgeLength: function( edge ){ return 10; },

  // Divisor to compute edge forces
  edgeElasticity: function( edge ){ return 1; },

  // Nesting factor (multiplier) to compute ideal edge length for nested edges
  // nestingFactor: 5,

  // Gravity force (constant)
  gravity: 100,

  // Maximum number of iterations to perform
  numIter: 3000,

  // Initial temperature (maximum node displacement)
  initialTemp: 400,

  // Cooling factor (how the temperature is reduced between consecutive iterations
  coolingFactor: 0.95,

  // Lower temperature threshold (below this point the layout will end)
  minTemp: 1.0,

  // Whether to use threading to speed up the layout
  useMultitasking: true
};



var computeSizeFn = function(node){

  var incomers = node.predecessors().length;
  var basic = 20;
  var final = basic; 


  if(node.data('marked') == true)
    return basic + 30;


  switch(true){

      case (incomers < 10):
          break;
      case (incomers < 30):
          final = basic + 50; 
          break;
      case (incomers < 50):
          final = basic + 100; 
          break;
      case (incomers > 50):
          final = basic + 150; 
          break;

  }

  return final + incomers + 'px'; 

}

var computeBgColorFn = function(node){

    // if filtered contribution
    if(node.data('match'))
      return "#0AEF40";

    if(node.data('owner') == true)
      return "#068E26";

    if(node.data('marked') == true)
      return "#F3CB17";


    var incomers = node.predecessors().length;
    var final = "#989BB4"; 

    switch(true){

        case (incomers < 10):
            break;
        case (incomers < 30):
            final = "#6B73B4"; 
            break;
        case (incomers < 50):
            final = "#4551B4"; 
            break;
        case (incomers > 50):
            final = "#2030B4"; 
            break;

    }

    return final; 

}

var computeFontFn = function(node){

    var incomers = node.predecessors().length;
    var basic = 0.3;
    var final = basic; 

    if(node.data('marked') == true)
      return basic + 1;


    switch(true){

        case (incomers < 10):
            break;
        case (incomers < 30):
            final = basic + 0.2; 
            break;
        case (incomers < 50):
            final = basic + 1.2; 
            break;
        case (incomers > 50):
            final = basic + 4; 
            break;

    }

    return final +'em'; 

}

var computeLabel = function(ele){
   return ele.data().name + " (" +  ele.predecessors().length/2 + ")";//ele.data().name.substr(0,5)+"...";
}


var edgeColorFn = function(ele){
    if(ele.data().properties.createdBy != undefined)
      return '#00FF60';
    else
      return '#303030';
}

/*
 * Cytoscape Specific Styles
 */
var graph_style = {

      hideLabelsOnViewport: false,

      layout: COSE_GRAPH_LAYOUT,
      
      style: 
        cytoscape.stylesheet()
          
          .selector('node')
            .css({
              'width': computeSizeFn,
              'height': computeSizeFn,
              'background-color': computeBgColorFn,
              'label' : computeLabel,
              'text-valign': 'center',
              //'text-margin-y': '0.1em',
              'font-size': computeFontFn,
              'color': '#474547',
              'line-height': '1em',
              'font-weight': '400',  
              'text-wrap': 'wrap',
              'text-max-width': '300px',
              'font-family': 'Roboto Condensed, sans serif',
              'min-zoomed-font-size': '1em',
              'margin': '300px'
            })

          .selector('edge')
            .css({
              'curve-style': 'haystack',
              'line-color': edgeColorFn,
              'width': 0.7,
              'font-size': '1.5em',
            })     

          .selector('.selected')
            .css({
              'background-color' : '#F0F311',
              'border-width': '5',
              'border-color': '#A4A4A4',
              'opacity': 1,
              'text-opacity': 1,
              'content' : 'data(name)',
              'font-size': '3.5em',
              'text-valign': 'top',
            })

          .selector('.highlighted')
            .css({
              'content' : 'data(name)',
              'font-size': '0.4em',
              'font-weight': '600',
              'text-wrap': 'wrap',
              'text-max-width': '300px',
              'min-zoomed-font-size': '1em',
              'z-index': 5,
              'opacity': 1,
              'text-opacity': 1
            })

          .selector('.unmarked')
            .css({
              'opacity': 0.1,
              'text-opacity': 0.2,
              'label': computeLabel
            })
          .selector('.marked')
            .css({
              'background-color' : '#0F8612',
              'border-width': '2',
              'border-color': 'white',
              'label' : computeLabel,
            })
          .selector('.marked-parent')
            .css({
              'background-color' : '#5E865F',
              'border-width': '1',
              'border-color': 'white'
            })
          .selector('.marked-children')
            .css({
              'background-color' : '#868686',
              'border-width': '1',
              'border-color': 'white'
            })

          .selector('edge.highlighted')
            .css({
              'curve-style': 'bezier',
              'target-arrow-shape': 'triangle',
              'line-color': '#999999',
              'target-arrow-color':'#CFCACA',
              'content' : 'data(name)',
              //'source-label' : 'data(name)',
              //'source-text-offset' : '1',
              //'target-label' : 'data(name)',
              'text-rotation' : 'autorotate',
              'width': 1.2,
              //'font-size': '0.7em',
              'font-weight': '400',
              'z-index': 5
            })
       
          .selector('.faded')
            .css({
              'opacity': 0.2,
              'text-opacity': 0.2
            })

          .selector('node.fullname')
            .css({
              'content' : 'data(name)'
            })

}

/*
 * Converts normal node from backend into cytoscape-specific format
 */
var createGraphNode = function(node){    return  { data: node };   }

/*
 * Converts normal edge from backend into cytoscape-specific format
 */
var createGraphEdge = function(edge){  return { data: edge };   }



/*
 * Makes the actual graph and defines functionality on the nodes and edges
 * Arguments - 
 *      data - Graph Data
 *      graphContainer - HTML Container for the graph
 *      graphFn - Conversion of nodes in data to cytoscape nodes
 *      edgeFn - Conversion of edges in data to cytoscape edges
 *      graphStyle - Graph Style 
 */
STUDIONET.GRAPH.makeGraph = function(data, graphContainer, graphLayout, graphFn, edgeFn){

    // if cytoscape canvas is defined, assign that
    if(arguments[1] != undefined)
      graph_style.container = arguments[1]; // assign raw DOM element
    
    if(arguments[2] != undefined)
      graph_style = graphLayout; 

    if(arguments[3] != undefined)
      createGraphNode = graphFn; 

    if(arguments[4] != undefined)
      createGraphEdge = edgeFn;

    var nodes = data.nodes.map( function(node){ return createGraphNode(node) } );
    var edges = data.links.map( function(edge){ return createGraphEdge(edge) } );
    
    nodes = nodes.filter(function(data){
        if(data.id == 5)
          return false; 
        else 
          return true;
    });
    edges = edges.filter(function(data){
        if(data.source == 5 || data.target == 5)
          return false; 
        else 
          return true;
    });
        //nodes: data.nodes.map( function(node){ return createGraphNode(node) } ), 
        //edges: data.links.map( function(edge){ return createGraphEdge(edge) } )


    graph_style.elements = {
        nodes: nodes,//data.nodes.filter( function(node){ if(node.id != 5) return createGraphNode(node) } ), 
        edges: edges//data.links.filter( function(edge){ if(edge.source !== 5 && edge.target != 5) return createGraphEdge(edge) else return false } )
    }

    // disable zooming
    //graph_style.zoomingEnabled = false;
    graph_style.minZoom = 0.05;
    graph_style.wheelSensitivity = 0.1;

    // performance options
    graph_style.hideEdgesOnViewport = true;
    graph_style.hideLabelsOnViewport = true;
    graph_style.motionBlur = true;

    graph = cytoscape( graph_style );
    //reposition();

    graph.fit();


    return graph;
    
}

/*
 * Helper Functions
 * Stackoverflow source
 */
var threshold = 6;
var reposition = function(){

      var topNodesLength = graph.nodes().length;

      // sort the nodes by the number of incomers 
      // incoming means the node pointing to is the qestion  (incase of answer) / main article (incase of comment) / resource_for (problem_statement) /  ....
      // incomers add value 
      // outgoers denote heirarchy
      var topNodes = graph.nodes().sort(function (ele1, ele2) {
          return ( ele1.predecessors().length > ele2.predecessors().length ? -1 : 1);
      });

      /*   Criteria : Everything is on the spiral initially  */
      topNodes = topNodes.filter(function(i, node){


            // if node has no trailing contributions, it's not placed on the spiral
            if(node.predecessors().length == 0)
              return false;

            // evaluating the node's parents
/*            var flag = true;
            node.successors().map(function(parent){
                if(parent.incomers().length > node.incomers().length)
                  flag = false;
            })  

            return flag;
*/
            // anything with number incomers 
            return node.predecessors().length >= threshold  // threshold = 0 for everything on the spiral - ensure equality
      })

      /*   Criteria : On the spiral if in top topNodesLength */
      //topNodes = topNodes.slice(0, topNodesLength)

      var angle = 2 * Math.PI / topNodes.length;
      var radius = 0.5*window.innerWidth;

      var initX = $(window).height()/2;
      var initY = $(window).width()/2;

      makeGalaxy( topNodes,  radius, initX, initY, undefined, 0, 6);

/*      arrangeIsolatedNodes(   graph.nodes().filter(function(i, node){
            return ( node.incomers().length <= 1 && node.outgoers().length <= 1);
      }) ); */
    
}


var arrangeIsolatedNodes = function( nodes ){
    nodes.map(function(node, index){
        node.animate({    position : {x: 0, y: 0 } , style: { backgroundColor: '#AFAFAF' }  }, { duration: 500 }, function(){ console.log("Isolated nodes arranged"); } );
    })
}

var makeGalaxy = function( nodes, radius, initX, initY, color, count, max_count, init_angle ){

      //var trend = "circular"; 

      // if first iteration
      //if(count == 0)
        trend = "spiralIn"

      var angle = (trend =='spiralIn') ? 2*Math.PI / 9: (2 * Math.PI / (nodes.length) );
      //var radius =  ( radius - 2*(max_count - count) > 0 )? (radius - 2*(max_count - count) ) : 50; 

      var colors = randomColors(nodes.length);
      var cluster_color;
      
      for(var i=0; i< nodes.length; i++){

          var node = nodes[i];

          if(trend === "spiralIn"){
            radius = radius + 20// increase radius with every node placed
            //angle = angle + (node.predecessors().length/10)
            angle = 0.98*angle;
          }

          var x = radius * Math.cos( (init_angle || 0 ) + angle*i ) + initX + node.predecessors().length;
          var y = radius * Math.sin( (init_angle || 0 ) +  angle*i ) + initY + node.predecessors().length;

          if(color == undefined)
            cluster_color = colors[i];
          else
            cluster_color = color; 

          node.animate({    position : {x: x, y: y} , style: { backgroundColor: "grey" }  }, { duration: 300 });
          node.data('color', cluster_color);

          if(count < max_count){

            var incomers = node.predecessors().filter(function(i, n){

               // if incomers of incoming nodes is greater than node's incomers, it'll be before this node in the spiral
              if(n.isNode() && n.predecessors().length < node.predecessors().length)
                return true;
              else
                return false;

               //return n.predecessors().length < node.predecessors().length && n.predecessors().length < threshold; 
            });

            /*
            var outgoers = node.outgoers().filter(function(i, n){
                return n.predecessors().length < threshold; 
            });
            
            incomers = incomers.add(outgoers); */
            
            //console.log("Making Galaxy for node", i, "in Galaxy iteration: ", count);
            makeGalaxy( incomers, /*100 +*/ incomers.length /*(12.5*incomers.length)/Math.PI*/ , x, y, cluster_color, count+1, max_count, (init_angle || 0 ) + angle*i );
          }

      }

}


function randomColors(total){
    var i = 360 / (total - 1); // distribute the colors evenly on the hue range
    var r = []; // hold the generated colors
    for (var x=0; x<total; x++)
    {
        r.push(hsvToRgb(i * x, 100, 100)); // you can also alternate the saturation and value for even more contrast between the colors
    }
    return r;
}

function hsvToRgb(h, s, v) {
  var r, g, b;
  var i;
  var f, p, q, t;
 
  // Make sure our arguments stay in-range
  h = Math.max(0, Math.min(360, h));
  s = Math.max(0, Math.min(100, s));
  v = Math.max(0, Math.min(100, v));
 
  // We accept saturation and value arguments from 0 to 100 because that's
  // how Photoshop represents those values. Internally, however, the
  // saturation and value are calculated from a range of 0 to 1. We make
  // That conversion here.
  s /= 100;
  v /= 100;
 
  if(s == 0) {
    // Achromatic (grey)
    r = g = b = v;
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
  }
 
  h /= 60; // sector 0 to 5
  i = Math.floor(h);
  f = h - i; // factorial part of h
  p = v * (1 - s);
  q = v * (1 - s * f);
  t = v * (1 - s * (1 - f));
 
  switch(i) {
    case 0:
      r = v;
      g = t;
      b = p;
      break;
 
    case 1:
      r = q;
      g = v;
      b = p;
      break;
 
    case 2:
      r = p;
      g = v;
      b = t;
      break;
 
    case 3:
      r = p;
      g = q;
      b = v;
      break;
 
    case 4:
      r = t;
      g = p;
      b = v;
      break;
 
    default: // case 5:
      r = v;
      g = p;
      b = q;
  }
 
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}


STUDIONET.GRAPH.getVisibleNodes = function(cy){

    var vw = cy.extent();
    var visible = [];

    cy.nodes().map(function(node){
      if( viewportContainsNode(vw, node) ){
        node.data('visible', true);
        visible.push(node);
      }
      else
        node.data('visible', false);
    })

    return visible;

}

function viewportContainsNode(vw, n){
    return ( ( n.position().x > vw.x1 && n.position().x < vw.x2 ) && ( n.position().y > vw.y1 && n.position().y < vw.y2  ) )
}

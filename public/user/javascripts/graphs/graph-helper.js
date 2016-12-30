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
  , color: '#000' // #rgb or #rrggbb or array of colors
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
     content: { title: "", text:""  },
     show: {
        evt: evt.type,
        ready: true,
        solo: true
     },
     hide: {
        evt: 'mouseout',
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
var GRID_GRAPH_LAYOUT = { name : 'grid' };
var DAGRE_GRAPH_LAYOUT = { name : 'dagre' };
var CIRCLE_GRAPH_LAYOUT = { name : 'circle' };
var COSE_GRAPH_LAYOUT = { name: 'cose', padding: 10, randomize: true };
var CONCENTRIC_GRAPH_LAYOUT = {  name: 'concentric', 
                                  concentric: function( node ){
                                    return node.degree();
                                  },
                                  levelWidth: function( nodes ){
                                    return 1;
                                  }};

var computeSizeFn = function(node){

    var successors = node.successors().length;
    var basic = 25;
    var final = basic; 

    if(node.data('marked') == true)
      return basic + 30;


    switch(true){

        case (successors < 10):
            break;
        case (successors < 30):
            final = basic + 20; 
            break;
        case (successors < 50):
            final = basic + 40; 
            break;
        case (successors > 50):
            final = basic + 60; 
            break;

    }

    return final; 

}

var computeBgColorFn = function(node){

    // if filtered contribution
    if(node.data('match'))
      return "#0AEF40";

    if(node.data('owner') == true)
      return "#068E26";

    if(node.data('marked') == true)
      return "#F3CB17";


    var successors = node.successors().length;
    var final = "#989BB4"; 

    switch(true){

        case (successors < 10):
            break;
        case (successors < 30):
            final = "#6B73B4"; 
            break;
        case (successors < 50):
            final = "#4551B4"; 
            break;
        case (successors > 50):
            final = "#2030B4"; 
            break;

    }

    return final; 

}

var computeLabel = function(ele){
   return ele.data().name.substr(0,5)+"...";
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
              'text-valign': 'bottom',
              'text-margin-y': '2',
              'font-size': '1em',
              'line-height': '1em',
              'font-weight': '400',  
              'text-wrap': 'wrap',
              'text-max-width': '30px',
              'font-family': 'Open Sans, sans serif',
              'min-zoomed-font-size': '1em',
              'margin': '20px'
            })

          .selector('edge')
            .css({
              'curve-style': 'haystack',
              'line-color': '#7E8CF8',
              'width': 1
            })     

          .selector('node.selected')
            .css({
              'background-color' : '#F0F311',
              'border-width': '2',
              'border-color': 'black'
            })

          .selector('node.highlighted')
            .css({
              'content' : 'data(name)',
              'font-size': '1em',
              'font-weight': '600',
              'text-wrap': 'wrap',
              'text-max-width': '70px',
              'min-zoomed-font-size': '1em',
              'z-index': 5

            })

          .selector('edge.highlighted')
            .css({
              'curve-style': 'bezier',
              'target-arrow-shape': 'triangle',
              'line-color': '#000000',
              'target-arrow-color':'black',
              'content' : 'data(name)',
              'width': 1.2,
              'font-size': '1em',
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
 * Helper Functions
 * Stackoverflow source
 */
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
      graph_style.container = document.getElementById(arguments[1]);

    if(arguments[2] != undefined)
      graph_style = graphLayout; 

    if(arguments[3] != undefined)
      createGraphNode = graphFn; 

    if(arguments[4] != undefined)
      createGraphEdge = edgeFn;

    graph_style.elements = {
        nodes: data.nodes.map( function(node){ return createGraphNode(node) } ), 
        edges: data.links.map( function(edge){ return createGraphEdge(edge) } )
    }

    // disable zooming
    //graph_style.zoomingEnabled = false;
    graph_style.minZoom = 0.1;
    graph_style.wheelSensitivity = 0.1;

    // performance options
    graph_style.hideEdgesOnViewport = true;
    graph_style.hideLabelsOnViewport = true;
    graph_style.motionBlur = true;

    var graph = cytoscape( graph_style );

    graph.fit();

    return graph;
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
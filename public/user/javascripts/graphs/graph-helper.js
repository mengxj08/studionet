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
  , color: '#fff' // #rgb or #rrggbb or array of colors
  , opacity: 0.1 // Opacity of the lines
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
        my: 'bottom center',
        at: 'top center'
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
  var basic = 10;
  var final = basic;

  if(node.data('marked') == true)
    return basic + 30;

  return basic;

  switch(true){

      case (incomers < 10):
          break;
      case (incomers < 30):
          final = basic + 10; 
          break;
      case (incomers < 50):
          final = basic + 15; 
          break;
      case (incomers > 50):
          final = basic + 20; 
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

    return 0.5 + 'em';

    if(node.data('marked') == true)
      return basic + 1;


    switch(true){

        case (incomers < 10):
            break;
        case (incomers < 30):
            final = basic + 0.2; 
            break;
        case (incomers < 50):
            final = basic + 0.7; 
            break;
        case (incomers > 50):
            final = basic + 1; 
            break;

    }

    return final +'em'; 

}

var computeLabel = function(ele){
   return ele.data().name.substr(0,10) + "..." /*+ " (" +  ele.predecessors().length/2 + ")";*///ele.data().name.substr(0,5)+"...";
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

      layout: {name: "preset"},

      style: 
        cytoscape.stylesheet()
          
          .selector('node')
            .css({
              'width': computeSizeFn,
              'height': computeSizeFn,
              'text-valign': 'bottom',
              'font-size': computeFontFn,
              'color': '#C0DD00',
              'font-weight': '400',  
              'font-size': '3px',
              'text-wrap': 'wrap',
              'text-max-width': '10px',
              'font-family': 'Roboto, sans serif',
              'min-zoomed-font-size': '1em',
              'margin': '300px',
              'source-arrow-shape': 'triangle',
              'border-width': 1,
              'background-color' : '#000623',
              'border-color': '#FFF'//'#AFAFAF'
            })

          .selector('edge')
            .css({
              'curve-style': 'haystack',
              'line-color': '#923F31',
              'width': 0.2
            })     

          // selected
          .selector('.selected')
            .css({
              'background-color' : '#A3BC05',//'#AFAFAF',
              'border-color': '#A3BC05',
            })


          // selected
          .selector('.marked.highlighted')
            .css({

            })
          .selector('.unmarked.highlighted')
            .css({

            })

          // unselected
          .selector('node.faded')
            .css({
              'width' : 1, 
              'height': 1
            })

          .selector('.marked')
            .css({
              'border-color': '#4A95EF'//'#AFAFAF',
            })

          .selector('.unmarked')
            .css({
              'border-color': '#FFF',//'#1F4A23'//'#B9B9B9',
            })

          .selector('node.glow')
            .css({
              'background-color' : '#DCE317',
              'width' : 15, 
              'height' : 15
            })


          .selector('edge.highlighted')
            .css({
              //'opacity': 0.6,
              'curve-style': 'bezier',
              'target-arrow-shape': 'triangle',
              'target-arrow-fill': 'hollow',
              'target-arrow-color': '#923F31',
              'haystack-radius': 0,
              'arrow-scale': 0.5,
              'width': 1
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
var spinner = new Spinner(STUDIONET.GRAPH.spinner);
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
    
    /*nodes = nodes.filter(function(data){
        if(data.id == 5)
          return false; 
        else 
          return true;
    }); */
    /*var manuallyCreatedEdges = [];
    console.log(edges.length, "before sorting");
    edges = edges.filter(function(edge){
        if(edge.data.properties.createdBy == undefined)
          return true; 
        else 
          return false;
    });
    console.log(edges.length, "after sorting");*/


    graph_style.elements = {
        nodes: nodes,//data.nodes.filter( function(node){ if(node.id != 5) return createGraphNode(node) } ), 
        edges: edges//data.links.filter( function(edge){ if(edge.source !== 5 && edge.target != 5) return createGraphEdge(edge) else return false } )
    }

    // disable zooming
    //graph_style.zoomingEnabled = true;
    graph_style.minZoom = 0.05;
    graph_style.maxZoom = 7;
    graph_style.wheelSensitivity = 0.1;
    graph_style.zoom = 0.10;

    // performance options
    graph_style.hideEdgesOnViewport = true;
    graph_style.hideLabelsOnViewport = true;
    graph_style.motionBlur = true;

    graph = cytoscape( graph_style );

    //graph.fit();


    return graph;
    
}

/*
 * Helper Functions
 * Stackoverflow source
 */

// number of incomers above which the node is placed on the spiral
// always double of number of incoming nodes required
STUDIONET.GRAPH.draw_graph = function(graph, threshold){

  spinner.spin(document.getElementById('cy'));
  console.log("Start spinner", document.getElementById('cy'));
  console.log(spinner);

  var sortFn = function (ele1, ele2) {
      return ( ele1.incomers().length > ele2.incomers().length ? -1 : 1);
  }

  // Sort the nodes first
  var sortedNodes = graph.nodes().sort( sortFn );

  // set the onSpiral value to -1 for all nodes
  graph.nodes().map(function(n){
      n.data('onSpiral', -1);
  }) ;

  // Extract nodes which will be on the spiral, including all children
  var spiralNodes = sortedNodes.filter(function(i, node){

      // this node will go on the spiral
      // hence all its parents should be marked
      if(node.incomers().length >= threshold && node.id() != 5){
        
            // mark the node to be on the spiral
            node.data('onSpiral', node.id() );

            var inc = 0;
            // mark all the parents to be on the spiral with this node
            node.incomers().nodes().map(function(child){

              if( child.data('onSpiral') == -1 ){
                child.data('onSpiral', node.id() );
                inc++;
              }

            });

            return true;
      
      }
      else{

            // node is not on the spiral due to less number of predecessors
            // check if it is part of another node already on the spiral
            // 
            if( node.data('onSpiral') !== -1 ){
              console.log("Node already part of the spiral");
            }
            
        return false;
      }
      
  });

  console.log("Original Spiral Nodes", spiralNodes.length);

  // add additional ones which are isolated
  for(var i=0; i < graph.nodes().length; i++){

      var node = graph.nodes()[i];


      if(node.data('onSpiral') == -1){

          //console.log("Doing node:", node.id());
          
          // add node to spiral
          spiralNodes = spiralNodes.add(node);
        
          // mark nodes predessors
          var inc = 0;
          node.incomers().nodes().map(function(child){

                if( child.data('onSpiral') == -1 ){
                  child.data('onSpiral', node.id() );
                  inc++;
                }
          });
          //console.log(inc, " additional marked and removed for id: ", node.id() );
      }


      if( i== graph.nodes().length - 1){
        spinner.stop();
        console.log("Last node stop spinner");
      }

  }

  //spiralNodes = spiralNodes.add( graph.nodes("[onSpiral=-1]") );
  console.log("Spiral nodes after addition", spiralNodes.length);

  var spiralNodes = spiralNodes.sort( sortFn );

  var angle = 2 * Math.PI / spiralNodes.length;
  var radius = 0.5*window.innerWidth;

  var initX = 0//$(window).height()/2;
  var initY = 0//$(window).width()/2;

      
  var prevRadius = 1;
  var x = initX;
  var y = 0;
  var radius = 150;
  var angle = 0;
  
  // for each node on the spiral, make a spiral of all its predecessors around it
  var nextNode = function(i){

      //console.log("Node No:", i);

      // node on spiral
      var node = spiralNodes[i];

      x = radius*Math.cos( angle ) + initX;
      y = radius*Math.sin( angle ) + initY;

      // place the spiral nodes
      node.animate(
          { 
            position : { x: x, y: y } 
          }, 
          { 
            duration: 10, 
            complete: function(){

                // find the children
                var condition = "[onSpiral=\'" + node.id() + "\']";
                var nodes = node.incomers().nodes(condition);

                var position = node.position(); 

                // make a smaller spiral of all the incomers
                // get the radius of the smaller spiral
                prevRadius = makeSubSpiral(nodes, position.x, position.y, 30) ;
                //console.log("Size of node No:", i, prevRadius);


                // use the radius of the above spiral to place next node
                //x += initX + prevRadius;
                minNodes = Math.floor( 2 * Math.PI * radius / prevRadius );

                // for minNodes
                angleInc = 2*Math.PI / minNodes; 
                radiusInc = (prevRadius + 30) / minNodes; 

                angle += 2*angleInc;
                radius += 4*radiusInc;

                x = radius*Math.cos( angle ) + initX;
                y = radius*Math.sin( angle ) + initY;
                
                if( i+1 < spiralNodes.length ){

                  graph.fit();
                  nextNode(i+1);
                }
                else{
                  graph.fit();
                }

            }
          }
      );

  }

  nextNode(0);



}


/*
 * In this case, the centre position being passed is already occupied
 * Return resulting radius of the subspiral
 * Perfect spiral - donot edit further!
 */
var makeSubSpiral = function(nodes, centerX, centerY, minimumRadius){

    var radius_SubNode = 10;
    var safety_gap = 10;

    var angle = Math.PI + Math.atan(centerY / centerX), 
        radius = minimumRadius, minNodes, angleInc, radiusInc;

    for(var i=0; i < nodes.length; i++){

      var node = nodes[i];

      minNodes = Math.floor( 2 * Math.PI * radius / radius_SubNode );

      // for minNodes
      angleInc = 2*Math.PI / minNodes; 
      radiusInc = (radius_SubNode + safety_gap) / minNodes; 


      var x = radius*Math.cos( angle ) + centerX;
      var y = radius*Math.sin( angle ) + centerY;

      angle += angleInc + Math.PI/30;
      radius += radiusInc;

      node.animate(
          { position : {x: x, y: y }  
          }, 
          { 
            duration: 500 
          } 
      );
    }

    if(nodes.length == 0)
      return radius_SubNode;

    return radius;
}


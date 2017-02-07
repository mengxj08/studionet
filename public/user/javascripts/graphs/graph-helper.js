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

    var rating = Math.ceil(node.data().rating);
    var final = "#000623"; 

    switch(rating){

        case (1):
            final = "#762A84"; 
            break;
        case (2):
            final = "#C0A6CC"; 
            break;
        case (3):
            final = "#F7F7F2"; 
            break;
        case (4):
            final = "#A4DC9D"; 
            break;
        case (5):
            final = "#1B7131"; 
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
              'background-color' : computeBgColorFn,//'#000623',
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
              'background-color' : 'yellow',// '#A3BC05',//'#AFAFAF',
              'border-color': '#A3BC05',
            })

          .selector('.permanent-selected')
            .css({
              'background-color' : 'yellow',// '#A3BC05',//'#AFAFAF',
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
              'border-color': '#00FF00',//'#AFAFAF',
              'border-width': 2
            })

          .selector('.unmarked')
            .css({
              'border-color': '#FFF',//'#1F4A23'//'#B9B9B9',
            })

          .selector('node.glow')
            .css({
              //'background-color' : '#5E5E5E',
              'width' : '12', 
              'height' : '12'
            })

          .selector('node.glow.faded')
            .css({
              //'background-color' : '#5E5E5E',
              'width' : '2', 
              'height' : '2'
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
var createGraphNode = function(node){    return  { data: node, position: {x:  $(window).width()/2, y:  $(window).height()/2 } };   }

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
spinner = new Spinner(STUDIONET.GRAPH.spinner);

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
    
    //console.log(edges.length, "before sorting");
    /*edges = edges.filter(function(edge){
        if(edge.data.properties.createdBy == undefined)
          return true; 
        else 
          return false;
    });
*/

    graph_style.elements = {
        nodes: nodes,
        edges: edges
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


    return graph;
    
}

/*
 * Helper Functions
 * Stackoverflow source
 */

// number of incomers above which the node is placed on the spiral
// always double of number of incoming nodes required
STUDIONET.GRAPH.draw_graph = function(graph, threshold, supernodeId){

  graph.reset();

  spinner.stop();

  var sortFn = function (ele1, ele2) {

      if( ele1.incomers().length == ele2.incomers().length )
        return ( ele1.predecessors().length > ele2.predecessors().length ? -1 : 1)
      else
        return ( ele1.incomers().length > ele2.incomers().length ? -1 : 1);
  }


  // Sort the nodes first
  var sortedNodes = graph.nodes().sort( sortFn );


  // Extract nodes which will be on the spiral, including all children
  var spiralNodes = sortedNodes.filter(function(i, node){

      // this node will go on the spiral
      // hence all its parents should be marked
      if(node.incomers().length >= threshold && node.id() != supernodeId){
        
            // mark the node to be on the spiral
            node.data('onSpiral', node.id() );

            var inc = 0;
            // mark all the parents to be on the spiral with this node
            node.incomers().nodes().map(function(child){

              if( child.data('onSpiral') == -1 ){
                child.data('onSpiral', node.id() );
              }

            });

            return true;
      
      }
      else{

            // node is not on the spiral due to less number of predecessors
            // check if it is part of another node already on the spiral
            // 
            if( node.data('onSpiral') !== -1 ){
              //console.log("Node already part of the spiral");
            }
            
        return false;
      }


  });


  // add additional ones which are isolated
  function isIsolated(nodeIndex){

      var node = sortedNodes[nodeIndex];

      if(node.data('onSpiral') == -1){

          // add node to spiral
          spiralNodes = spiralNodes.add(node);
          node.data('onSpiral', node.id());
   
          // mark nodes predessors
          for(var i=0; i < node.incomers().length; i++){

              var child = node.incomers()[i];
              if( child.data('onSpiral') == -1 ){
                child.data('onSpiral', node.id() );
              }

          } 
          
      }

      if(nodeIndex+1 < graph.nodes().length)
        isIsolated(nodeIndex+1);

  }
  isIsolated(0);

  spiralNodes = spiralNodes.sort( sortFn );

  var angle = 2 * Math.PI / spiralNodes.length;
  var radius = 0.5*window.innerWidth;

  var initX = $(window).width()/2;
  var initY = $(window).height()/2;

      
  var prevRadius = 1;
  var x = 0;
  var y = 0;
  var radius = 150;
  var angle = 0;
  
  // for each node on the spiral, make a spiral of all its predecessors around it
  var nextNode = function(i){

      ////console.log("Node No:", i);

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
                ////console.log("Size of node No:", i, prevRadius);


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

                  //graph.fit();
                  nextNode(i+1);
                }
                else{
                  spinner.stop();
                  console.log("graph finished", new Date())
                  //graph.fit();
                }

            }
          }
      );

  }

  console.log("Animation started", new Date());
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

    var angle = Math.atan( Math.abs(centerY / centerX) ), 
        radius = minimumRadius, minNodes, angleInc, radiusInc;

    //console.log((angle*57.2).toFixed(2) + " deg");

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
            duration: 400 
          } 
      );
    }

    if(nodes.length == 0)
      return radius_SubNode;

    return radius;
}


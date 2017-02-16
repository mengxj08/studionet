/*
 *    This file is used to generate the graph and make the spiral (or some other) layout
 *    Ordering of functions might be important in this file because of cytoscape.js
 * 
 */


// ---- Graph Styling 

// Dynamic Styling functions
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

    if(node.data('type') == "comment")
      return "red";

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

var computeShapeFn = function(ele){

  if(ele.successors().length == 0)
    return "diamond";
  else if(ele.incomers().length == 0)
    return "ellipse";
  else 
    return "hexagon";

}

var edgeColorFn = function(ele){
    /*if(ele.data('name') == "COMMENT_FOR")
      return "#3535C9";
    if(ele.data().properties.createdBy != undefined)
      return '#00FF60';
    else*/
      return '#303030';
}

// Data conversion
var createGraphNode = function(node){    return  { data: node, position: {x:  $(window).width()/2, y:  $(window).height()/2 } };   }

var createGraphEdge = function(edge){  return { data: edge };   }

// Graph Style Object
var graph_style = {

      hideLabelsOnViewport: false,

      layout: {name: "preset"},

      style: 
        cytoscape.stylesheet()
          
          .selector('node')
            .css({
              'shape': computeShapeFn,
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
              'line-color': edgeColorFn, //'#923F31',
              'width': 0.2
            })     

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

          .selector('node.read')
            .css({
              //'background-color' : '#5E5E5E',
              'width' : 6, 
              'height' : 6
            })

          .selector('.marked.highlighted')
            .css({

            })
            
          .selector('.unmarked.highlighted')
            .css({

            })

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

          .selector('node.glow.read')
            .css({
              //'background-color' : '#5E5E5E',
              'width' : 7.5, 
              'height' : 7.5
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
 * Makes the actual graph and defines functionality on the nodes and edges
 * Arguments - 
 *      data - Graph Data
 *      graphContainer - HTML Container for the graph
 *      graphFn - Conversion of nodes in data to cytoscape nodes
 *      edgeFn - Conversion of edges in data to cytoscape edges
 *      graphStyle - Graph Style 
 */
STUDIONET.GRAPH.makeGraph = function(data, graphContainer){

    // if cytoscape canvas is defined, assign that
    if(arguments[1] != undefined)
      graph_style.container = arguments[1]; // assign raw DOM element


    var nodes = data.nodes.map( function(node){ return createGraphNode(node) } );
    var edges = data.links.map( function(edge){ return createGraphEdge(edge) } );
    
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


// number of incomers above which the node is placed on the spiral
// always double of number of incoming nodes required
STUDIONET.GRAPH.draw_graph = function(graph, threshold, supernodeId, spinner, max_width, max_height){

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
  console.log(spiralNodes.length);

  var angle = 2 * Math.PI / spiralNodes.length;
  var radius = 0.5*max_width;

  var initX = max_width/2;
  var initY = max_height/2;
      
  var prevRadius = 1;
  var x = 0;
  var y = 0;
  var radius = 150;
  var angle = 0;
  

  // for each node on the spiral, make a spiral of all its predecessors around it
  var nextNode = function(i){

      // node on spiral
      var node = spiralNodes[i];

      x = radius*Math.cos( angle ) + initX;
      y = radius*Math.sin( angle ) + initY;

      if(node.position().x == x && node.position().y == y){
        placeSubSpirals(node, i);
      }
      else{
        // place the spiral nodes
        node.animate(
            { 
              position : { x: x, y: y } 
            }, 
            { 
              duration: 10, 
              complete: function() { placeSubSpirals(node, i) }
            }
        );
      }


  }

  var placeSubSpirals = function(node, i){

    // find the children
    var condition = "[onSpiral=\'" + node.id() + "\']";
    var nodes = node.incomers().nodes(condition); 

    var position = node.position(); 

    // make a smaller spiral of all the incomers
    // get the radius of the smaller spiral
    prevRadius = makeSubSpiral(nodes, position.x, position.y, 30) ;


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
      nextNode(i+1);
    }
    else{
      spinner.stop();
      // do something after graphing finished
    }
  }


  /*
   * In this case, the centre position being passed is already occupied
   * Return resulting radius of the subspiral
   * Perfect spiral - donot edit further!
   */
  var makeSubSpiral = function(nodes, centerX, centerY, minimumRadius){

      var radius_SubNode = 10;
      var safety_gap = 10;

      var deltaX = (centerX - initX);
      var deltaY = (centerY - initY);

      var angle = Math.atan( deltaY / deltaX ), 
          radius = minimumRadius, minNodes, angleInc, radiusInc;

      // Angle Correction
      //                |
      //       x-ve     |     x +ve
      //       y-ve     |     y -ve
      //                |
      //  --------------------------------
      //                |     
      //       x -ve    |     x +ve
      //       y +ve    |     y +ve
      //                |
      // https://www.mathworks.com/matlabcentral/answers/9330-changing-the-atan-function-so-that-it-ranges-from-0-to-2-pi?requestedDomain=www.mathworks.com
      if(deltaY > 0 && deltaX < 0)
        angle = Math.PI  + angle;
      else if(deltaY < 0 && deltaX < 0)
        angle = -Math.PI + angle;
      else if(deltaY > 0 && deltaX ==0 )
        angle = -Math.PI/2
      else if(deltaY < 0 && deltaX == 0)
        angle = -Math.PI/2

      if(angle < 0)
        angle = angle + 2*Math.PI



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

        if(node.position().x == x && node.position().y == y){

        }
        else{
          node.animate(
              { 
                position : {x: x, y: y }  
              }, 
              { 
                duration: 400 
              } 
          );
        }


      }

      if(nodes.length == 0)
        return radius_SubNode;

      return radius;
  }


  nextNode(0);

}


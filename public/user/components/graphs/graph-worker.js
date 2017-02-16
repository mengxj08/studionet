onmessage = function(e) {
  console.log('Message received from main script');
  var workerResult = 'Result: ' + (e[0]);
  console.log('Posting message back to main script');
  postMessage(workerResult);
}


// number of incomers above which the node is placed on the spiral
// always double of number of incoming nodes required
var draw_graph = function(graph, threshold, supernodeId, spinner, max_width, max_height){

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


angular.module('studionet')

/*
 *	Controller for Groups
 * 
 */
.controller('GroupsCtrl', ['$scope', 'profile', 'groups', 'users', 'group', '$http', function($scope, profile, groups, users, group, $http){

	/*
	 * Scope Variables
	 */
	$scope.user = profile.user;
	$scope.groups = groups.groups;
	$scope.users = users.usersById();

	$scope.activeGroup; 

	/*
	 *  Helper Functions for the graph
	 */
	
	// Function to format graph nodes
	var createGraphNode = function(node){
	    
	    node.faveShape = "ellipse";

	    if( node.supernode ){
	          node.faveShape = "ellipse";
	          node.faveColor = "black";
	          node.width = "40";
	          node.height = "40";      
	    }
	    else if( node.type == "USER" ){
	          node.faveShape = "ellipse";
	          node.faveColor = "red";
	          node.width = "10";
	          node.height = "10";      
	    }
	    else if( node.requestingUserStatus == "Admin" ){
	          node.faveShape = "ellipse";
	          node.faveColor = "blue";
	          node.width = "20";
	          node.height = "20";      
	    }
	    else if( node.requestingUserStatus ){
	          node.faveShape = "ellipse";
	          node.faveColor = "green";
	          node.width = "20";
	          node.height = "20";      
	    }
	    else if( node.restricted ){
	          node.faveShape = "ellipse";
	          node.faveColor = "grey";
	          node.width = "20";
	          node.height = "20";      
	    }		    
	    else if( !node.restricted){
	          node.faveShape = "ellipse";
	          node.faveColor = "lightgreen";
	          node.width = "20";
	          node.height = "20";      
	    }
	    else {
	          node.faveShape = "ellipse";
	          node.faveColor = "red";
	          node.width = "10";
	          node.height = "10";
	    }

	    return  { data: node };
	}

	var createGraphEdge = function(edge){

	    edge.strength = EDGE_DEFAULT_STRENGTH;
	    edge.faveColor = EDGE_DEFAULT_COLOR;
	    edge.weigth = EDGE_DEFAULT_WEIGHT;
	    edge.label = edge.type;

	    return { data: edge };

	}

	var onTap = function(evt){
		
		if(evt.cyTarget.data().type == "USER"){
			console.log("you clicked on a user");
		}
		else{

			// remove other users
			var collection = cy.elements("node[type = 'USER']");
			cy.remove( collection );
			 
			if( evt.cyTarget.data().supernode ){
				return; 
			}
			else{

				group.getGroupInfo(evt.cyTarget.data().id).then( function(){

					// explode the node to show users
					group.getGroupUsers(evt.cyTarget.data().id)
					.then(function(){

						for (var i=0; i<group.users.length; i++) {

							group.users[i].type = "USER";

							var node = {
								group: "nodes",
								data: createGraphNode( group.users[i] ).data
							}

							var edge =  { source: evt.cyTarget.data().id, target: group.users[i].id }
							var edge = {
								group: "edges",
								data: createGraphEdge(edge).data
							}

						    cy.add([ node, edge ]);
						    cy.layout().stop(); 
						    layout = cy.elements().makeLayout({ 'name': 'cola'}); 
						    layout.start();

						}


					});
				})
				
			}
			
		}
	}

	var onHover = function(evt){
	    var node = evt.cyTarget;
	    var nodeData = node.data();

	    var qtipFormat = {
	         content: {
	         	title: nodeData.name,
	         	text: ""
	    	 },
	         
	         show: {
	            evt: evt.type,
	            ready: true
	         },
	         
	         hide: {
	            evt: 'mouseout',
	         },
	         
	         position: {
	         	my: 'top left',
	         	at: 'center center'
	         },
	         
	         style: {
	         	name: 'dark'
		        //classes: 'myCustomClass',
		        //width: 200 // Overrides width set by CSS (but no max-width!)
		        //height: 100 // Overrides height set by CSS (but no max-height!)
		     }
	    }

	
	    // change content text for users
	    if(nodeData.type == "USER"){
	    	qtipFormat.content.text = "<center><img " + 
	    				   "style='width: 80px; height: 80px;' " +
	    				   "src=' " + nodeData.avatar+ "'><br>";

	    	qtipFormat.style.width = '80px';

	    } 

	    node.qtip(qtipFormat, evt);		
	}

	var drawGraph = function(){

		groups.getAll().then( function(){

				groups.getGraph().then(function(){

						console.log("drawing graph")
						// creating the grpah
						var graph = makeGraph( groups.graph, 'user-graph', createGraphNode);
						
						// add interactions 
						graph.on('tap', 'node', function(evt){ onTap(evt); })
						graph.on('mouseover', 'node', function(evt) { onHover(evt); });

						// attach it to the scope
						$scope.graph = graph;
			    })

		})

	};

	
	/*
     *		Trigger Modal Functions
	 */
	$scope.createGroup = function(){ $("#createGroupModal").modal(); }

	/*** Viewing ***/
	// fix - global variables are bad
	viewGroup = function(){	$("#viewGroupModal").modal();	};


	drawGraph();

	$scope.refreshGraph = drawGraph;
	$scope.viewGroup = viewGroup;


}])


/*
 *	Controller for the group creation modal 
 */
.controller('CreateGroupCtrl', ['$scope', 'groups', 'supernode', function($scope, groups, supernode){

	$scope.groupCreated = false; 
	$scope.groupError = false;


	$scope.group = {
		groupParentId: supernode.group
	};

	$scope.createGroup = function(){

		groups.createNewGroup($scope.group).then( function(data){
		
			// refresh the graph underneath
			// function present in container scope
			
			$scope.$parent.refreshGraph();
			showSuccess();
		
		}, function(error){

			showError();

		});

	}

	$scope.editGroup = function(){
		$("#editModal").modal();
	}

	var showSuccess = function(){

		$scope.groupCreated = true;
		$scope.groupError = false;
		
	}

	var showError = function(){
		$scope.groupError = true;
	}


}])


/*
 *	Controller for the edit group modal 
 */
.controller('EditGroupCtrl', ['$scope', 'groups', 'group', 'supernode', function($scope, groups, group, supernode){
	
	/*** Editing Group ***/
	$scope.saveGroupEdit = function(){

		console.log($scope.activeGroup);
		
		$http({
		  method  : 'PUT',
		  url     : '/api/groups/' + $scope.activeGroup.id,
		  data    : $scope.activeGroup,  // pass in data as strings
		  headers : { 'Content-Type': 'application/json' }  // set the headers so angular passing info as form data (not request payload)
		 })
		.success(function(data) {
		    
		    console.log("data", data);

		    if (!data.success) {


		      // if not successful, bind errors to error variables
		      //$scope.errorName = data.errors.name;
		      //$scope.errorSuperhero = data.errors.superheroAlias;
		    } else {
		      // if successful, bind success message to message
		      //$scope.message = data.message;
		    }

		  })	

	}

	$scope.deleteGroup = function(){
		group.deleteGroup();
	}
	

}])

/*
 *	Controller for the view group modal 
 */
.controller('ViewGroupCtrl', ['$scope', 'profile', 'group', function($scope, profile, group){

	// check if scope has active group
	$scope.activeGroup = group.group;
	$scope.members = group.users;

	console.log(group.group);

	$scope.active = 0; 
	$scope.error = undefined;
	$scope.success = undefined; 

	$scope.reset = function(){
		$scope.active = 0; 
		$scope.error = undefined;
		$scope.success = undefined; 
	}

	$scope.deleteGroup = function(){
		group.deleteGroup().then(function(){
				showSuccess();

				$scope.$parent.refreshGraph();


		}, function(){
				showError();
		});



	}

	var showSuccess = function(){

		$scope.success = true;
		$scope.error = false;
		$scope.successMsg = "Group has been deleted."
		
	}

	var showError = function(){
		$scope.error = true;
	}

}])


/*
 *	Controller for the view group modal 
 */
.controller('UserListCtrl', ['$scope', 'group', function($scope, groups, group){

	// check if scope has active group
	$scope.activeGroup = group.group;
	$scope.members;

	group.getGroupUsers( $scope.activeGroup.id ).then( function(){ $scope.members = group.users; });

	$scope.active = 0; 
	$scope.error = undefined;
	$scope.success = undefined; 


	$scope.leaveGroup = function(){

		var data = {
			groupId: $scope.activeGroup.id,
			userId: $scope.user.id
		}

		group.removeGroupMember(data);
		drawGraph();
	}


	$scope.joinGroup = function(){

		var data = {
			'userId': $scope.user.id,
			'groupId': $scope.activeGroup.id,
			'groupRole': 'Member'
		}

		group.addGroupMember(data);

		drawGraph();

	}




}])
angular.module('studionet')

/*
 *	Controller for Groups
 * 
 */
.controller('GroupsCtrl', ['$scope', 'profile', 'groups', 'users', 'group', '$http', function($scope, profile, groups, users, group, $http){

	/*
	 *	Constants for Member Status
	 */



	/*
	 * Scope Variables
	 */
	$scope.user = profile.user;
	$scope.groups = groups.groups;
	$scope.users = users.usersById();
	$scope.graph = {};
	$scope.activeGroup = {
			'name' : "",
			'description' : "",
			'restricted': false,
			'groupParentId': "" 
	};  // placeholder group
	$scope.activeElement = {};

	/*
	 *  Helper Function
	 */
	var drawGraph = function(){
		
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
	
		// creating the grpah
		var graph = makeGraph( groups.graph, 'user-graph', createGraphNode);
		
		graph.on('tap', 'node', function(evt){

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

						};


					});
					

					$scope.viewGroup(evt.cyTarget.id());
		    		$scope.activeElement = evt.cyTarget.data();

		    		//$("#viewModal").modal();
				}
				
			}

		})

		graph.on('mouseover', 'node', function(event) {

		    var node = event.cyTarget;
		    node.qtip({
		         content: {
		         	title: node.name,
		         	text: "Lorem ipsum Culpa veniam ex sed aute sed exercitation incididunt magna aliquip in nisi id esse eiusmod incididunt id Duis anim magna laboris elit qui occaecat culpa dolore in fugiat laborum nisi sit nostrud anim sunt consequat sed nulla sint id Excepteur."
		         },
		         show: {
		            event: event.type,
		            ready: true
		         },
		         hide: {
		            event: 'mouseout unfocus'
		         }
		    }, event);

		});

		graph.nodes().qtip({
		    content: {
		        text: 'I am positioned in relation to the mouse'
		    },
		    position: {
		        target: 'mouse'
		    }
		});

		$scope.graph = graph;

	};


	drawGraph();



	/*** Viewing ***/
	$scope.viewGroup = function(id){
		group.getGroupInfo(id);
		group.getGroupUsers(id);
		$scope.activeGroup = group.group;
		$scope.activeGroup.users = group.users;
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

	$scope.editGroup = function(id){
		group.getGroupInfo(id);
		group.getGroupUsers(id);
		$scope.activeGroup = group.group;
	}


	/*** Creating ***/
	$scope.createGroup = function(){
		
		$scope.activeGroup = {
			'name' : "",
			'description' : "",
			'restricted': false,
			'groupParentId': "-1",
		};

		$("#createGroupModal").modal();

	}

	$scope.toggleRestricted = function(){
		$scope.activeGroup.restricted = !$scope.activeGroup.restricted;
	}


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


	/*** Adding User *****/
	$scope.groupUsers = [];
	$scope.addUserModal = function(group){
		$scope.groupUsers = []
		$scope.activeGroup = group;
		$scope.users = [];
		console.log($scope.activeGroup);
		console.log('/api/groups/' + $scope.activeGroup.id + '/users');

		$http.get('/api/users/').success(function(data){

			$http.get('/api/groups/' + $scope.activeGroup.id + '/users').success(function(subdata){
				
				$scope.groupUsers = subdata;

				// attach role with this group to the users
				for(var i=0; i<subdata.length; i++){

					for(j=0; j < data.length; j++){

						if(subdata[i].id == data[j].id){
							data[j].status = "Yes";
						}
						else{
							data[j].status = "No";
						}
					}
				}
					
				$scope.users = data;

			});	
		});		
	}


	$scope.addUser = function(user){

		var data = {
			'userId': user.id,
			'groupId': $scope.activeGroup.id,
			'groupRole': 'Member'

		}


		if(user.status == "No"){

			// add users in $scope.groupUsers 
			// POST /api/groups/:groupId/users/
			$http({
			  method  : 'POST',
			  url     : '/api/groups/' + $scope.activeGroup.id +'/users/',
			  data    : data,  // pass in data as strings
			  headers : { 'Content-Type': 'application/json' }  // set the headers so angular passing info as form data (not request payload)
			 })
			.success(function(data) {
			    
			    if(data){
			    	user.status = "Yes"
			    }

			  })				
		}
		else{
			// remove user from group
			user.status = "No";
		}
		

	}

	$scope.leaveGroup = function(){

		var data = {
			groupId: $scope.activeGroup.id,
			userId: $scope.user.id
		}

		group.removeGroupMember(data);
		drawGraph();
	}

	$scope.deleteGroup = function(){
		group.deleteGroup();
	}



}])


.controller('CreateGroupCtrl', ['$scope', 'groups', 'supernode', function($scope, groups, supernode){

	$scope.group = {
		groupParentId: supernode.group
	};

	$scope.createGroup = function(){

		console.log($scope.group);
		groups.createNewGroup($scope.group)
	}

}])
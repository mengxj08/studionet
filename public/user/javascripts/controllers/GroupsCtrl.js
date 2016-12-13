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
		    
		    if( node.properties.superNode != undefined ){
		          node.faveShape = "ellipse";
		          node.faveColor = "black";
		          node.width = "40";
		          node.height = "40";      
		    }
		    else if( node.properties.role == "Admin" ){
		          node.faveShape = "ellipse";
		          node.faveColor = "blue";
		          node.width = "20";
		          node.height = "20";      
		    }
		    else if( node.properties.role ){
		          node.faveShape = "ellipse";
		          node.faveColor = "green";
		          node.width = "20";
		          node.height = "20";      
		    }
		    else if( node.properties.restricted){
		          node.faveShape = "ellipse";
		          node.faveColor = "grey";
		          node.width = "20";
		          node.height = "20";      
		    }		    
		    else if( !node.properties.restricted){
		          node.faveShape = "ellipse";
		          node.faveColor = "lightgreen";
		          node.width = "20";
		          node.height = "20";      
		    }
		    else {
		          node.faveShape = CONTRIBUTION_SHAPE;
		          node.faveColor = CONTRIBUTION_COLOR;
		          node.width = CONTRIBUTION_WIDTH;
		          node.height = CONTRIBUTION_HEIGHT;
		    }

		    return  { data: node };
		}

		// preprocessing
		profile.getGroups();
	    groups.graph.nodes.map( function(node){
	    	var created = node.properties.createdBy; 
	    	if(node.properties.createdBy == $scope.user.id)
	    		node.properties.role = "Admin";
	    	else {
	    		for(var i=0; i < profile.groups.length; i++){
	    			if(profile.groups[i].id == node.id){ console.log("mem")

	    				node.properties.role = "Member";
	    			}
	    		}
	    	}
	    })
	
		// creating the grpah
		var graph = makeGraph( groups.graph, 'user-graph', createGraphNode);
		
		// relate with current user
		profile.groups.map( function(group){
			graph.getElementById(group.id).data().role = group.role;
			graph.getElementById(group.id).data();
		})

		// 
		graph.on('tap', 'node', function(evt){
			    		
			    		if(evt.cyTarget.data().properties.superNode == undefined){
				    		
				    		$scope.viewGroup(evt.cyTarget.id());
				    		$scope.activeElement = evt.cyTarget.data();
				    		
				    		$("#viewModal").modal();
			    		}

			    		//console.log(evt.cyTarget.data().properties.createdBy == profile.id);

			    	})

		$scope.graph = graph;

	};


	drawGraph();



	/*** Viewing ***/
	$scope.viewGroup = function(id){
		group.getGroupInfo(id);
		group.getGroupUsers(id);
		$scope.activeGroup = group.group;
		$scope.activeGroup.users = group.users;

		group.users.map( function(user){
			$scope.users[user.id].status = "Yes";
		})
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


	/** Saving Group ***/
	$scope.saveGroup = function(){

		// Convert Group Parent Id to Integer
		$scope.activeGroup.groupParentId = parseInt($scope.activeGroup.groupParentId);
		console.log($scope.activeGroup);

		
		
		$http({
		  method  : 'POST',
		  url     : '/api/groups/',
		  data    : $scope.activeGroup,  // pass in data as strings
		  headers : { 'Content-Type': 'application/json' }  // set the headers so angular passing info as form data (not request payload)
		 })
		.success(function(data) {
		    
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

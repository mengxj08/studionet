angular.module('studionet')

.controller('UserCtrl', ['$scope', 'profile', function($scope, profile){
	$scope.user = profile.user;
	$scope.modules = profile.modules;

	
}])

.controller('ProfileCtrl', ['$scope', 'profile', '$http', function($scope, profile, $http){

	/*
	 *	Functionality for User Profile Page
	 */
	
	$scope.uploadPic = function(avatar) {
	    avatar.upload = Upload.upload({
	      url: '/uploads/avatar',
	      data: {username: $scope.username, avatar: avatar},
	    });

	    avatar.upload.then(function (response) {
	      $timeout(function () {
	        avatar.result = response.data;

	         // force a reload for avatar
		      var random = (new Date()).toString();
		      profile.getUser().then(function(){
			      $scope.user.avatar = $scope.user.avatar + "?cb=" + random;
			    });
	      });
	    }, function (response) {
	      if (response.status > 0)
	        $scope.errorMsg = response.status + ': ' + response.data;
	    }, function (evt) {
	      // Math.min is to fix IE which reports 200% sometimes
	      avatar.progress = Math.min(100, parseInt(100.0 * evt.loaded / evt.total));
	    });
   	}

  	$scope.uploadModel = function(model){
	    model.upload = Upload.upload({
	      url: '/uploads/models',
	      data: {username: $scope.username, model: model},
	    });

    	model.upload.then(function (response) {
		      $timeout(function () {
		        model.result = response.data;
		      });
		    }, function (response) {
		      if (response.status > 0)
		        $scope.errorMsg = response.status + ': ' + response.data;
		    }, function (evt) {
		      // Math.min is to fix IE which reports 200% sometimes
		      model.progress = Math.min(100, parseInt(100.0 * evt.loaded / evt.total));
		    });
  	};

  	$scope.changeName = function($event){
  		
  		if($event.keyCode==13){

  			$http({
				  method  : 'PUT',
				  url     : '/api/profile/',
				  data    : $scope.user,  // pass in data as strings
				  headers : { 'Content-Type': 'application/json' }  // set the headers so angular passing info as form data (not request payload)
				 })
				.success(function(data) {
				    
					alert("Name updated");    

				})
  		}
  	}
	  




}])

/*
 *	Controller for Groups
 * 
 */
.controller('GroupsCtrl', ['$scope', 'profile', '$http', function($scope, profile, $http){


	$scope.user = profile.user;
	$scope.modules = profile.modules;

	// Initial no group
	$scope.groups = [
		{
			'name': 'None',
			'id': -1
		}

	]


	refresh();
	function refresh(){

		$scope.groups = [		{
			'name': 'None',
			'id': -1
		}];
		$scope.users = [];

		/** better solution to get data this way from server */
		// get general list of groups
		$http.get('/api/groups/').success(function(data){
			$scope.groups = $scope.groups.concat(data);

			// append data from user modules
			for(var mod=0; mod < $scope.modules.length; mod++){
				for(var g=0; g < $scope.groups.length; g++ ){
					if($scope.modules[mod].id == $scope.groups[g].id){
						// assign role
						$scope.groups[g].role =  $scope.modules[mod].role;
					}
				}
			}

			console.log($scope.groups);
		});

		$http.get('/api/users/').success(function(data){
			$scope.users = data;
		});		
	}


	$scope.displayError = false;
	$scope.displaySuccess = false;
	
	$scope.users = undefined;

	$scope.activeGroup = {

			'name' : "",
			'description' : "",
			'restricted': false,
			'groupParentId': "" 

		};


	/*** Viewing ***/
	$scope.viewGroup = function(group){
		$scope.activeGroup = group;
		
		/*
		 * Details of the group
		 */
		console.log('/api/groups/' + $scope.activeGroup.id);
		$http({
		  method  : 'GET',
		  url     : '/api/groups/' + $scope.activeGroup.id,
		 })
		.success(function(data) {
			    
		    if (data == undefined) {
				console.log("Error fetching Group Data")
		    } else {

		    	//console.log(data, data);
				// Add additional data    
				data.role = $scope.activeGroup.role;
				$scope.activeGroup = data;
		    }

		  })


	}

	$scope.joinGroup = function(){

	}

	$scope.editGroup = function(group){
		$scope.activeGroup = group;
	}


	/*** Creating ***/
	$scope.createGroup = function(){
		
		$scope.activeGroup = {

			'name' : "",
			'description' : "",
			'restricted': false,
			'groupParentId': "-1",
		};
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

		refresh();

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



}])


/*
 *
 *	Controller for Graph View
 *	
 * 
 */

.controller('UserGraphCtrl', ['$scope', 'profile', '$http', function($scope, profile, $http){


	$scope.user = profile.user;
	$scope.modules = profile.modules;

	$http({
		  method  : 'GET',
		  url     : '/graph/all/users',
		 })
		.success(function(data) {
			    
		    if (data == undefined) {
				console.log("Error fetching Group Data")
		    } else {


						var data = data;

						var colors = {
						"Arsenal":         "#da4480"
						,"Aston Villa":    "#5ab449"
						,"Bournemouth":    "#7f5acd"
						,"Chelsea":        "#aab740"
						,"Crystal Palace": "#ce58c0"
						,"Everton":        "#50a26e"
						,"Leicester City": "#d1434b"
						,"Liverpool":      "#45c0bc"
						,"Manchester City":"#ce5929"
						,"Manchester Utd": "#4e7bda"
						,"Newcastle Utd":  "#d49d3c"
						,"Norwich City":   "#6660a3"
						,"Southampton":    "#7b853c"
						,"Stoke City":     "#b58dde"
						,"Sunderland":     "#97622e"
						,"Swansea City":   "#609dd6"
						,"Tottenham":      "#e29074"
						,"Watford":        "#9c4b88"
						,"West Bromwich":  "#ab505f"
						,"West Ham Utd":   "#dc85b6"
						};

						var sortOrder = data.map(function(d){
							return d[0]
						});
						
						function sort(a,b){ return d3.ascending(sortOrder.indexOf(a),sortOrder.indexOf(b)); }

						var ch = viz.ch().data(data)
						      .padding(.01)
						      .sort(sort)
						    .innerRadius(430)
						    .outerRadius(450)
						    .duration(1000)
						    .chordOpacity(0.3)
						    .labelPadding(.03)
						      .fill(function(d){ return colors[d];});

						var width=1200, height=1100;

						var svg = d3.select("#user-graph").append("svg").attr("height",height).attr("width",width);

						svg.append("g").attr("transform", "translate(550,450)").call(ch);

						// adjust height of frame in bl.ocks.org
						d3.select(self.frameElement).style("height", height+"px").style("width", width+"px");   
							    }

		  })



  


}])




/*
 *	Remove in production
 * 	To create synthetic data and check APIs
 *
 * 
 */
angular.module('studionetAdmin').controller('TestCtrl', ['$scope', '$http', function($scope, $http){

	$scope.users = [];
	$scope.tags = [];
	$scope.contributions = [];
	$scope.relationships = [];


	
	var refresh = function(){
		$http.get('/api/users/').success(function(data){
			$scope.users = data;
		});		

		$http.get('/api/tags/').success(function(data){
			$scope.tags = data;
		});		


		$http.get('/api/contributions/').success(function(data){
			$scope.contributions = data;
		});	

		$http.get('/api/relationships/').success(function(data){
			$scope.relationships = data;
		});	


		$scope.groupData = { 
		    name: "",
			description: "",
			restricted: false,
			groupParentId: "-1",
			author:  null,
			createdAt: null
		};
	}



	/*
	 *	To create simulated contributions
	 * 
	 */
	$scope.contributionData = { "author":"3","ref":"107","refType":"ANSWER_FOR", 'tags' : ["assignment", "submission"], 'title': 'Assignment 6', 'body': 'Lorem ipsum Laborum mollit elit tempor eu irure aliqua cillum nisi quis ex dolor aliquip anim exercitation eu aliquip et adipisicing esse ullamco pariatur esse exercitation consequat minim laborum officia voluptate ad elit deserunt ad amet et esse sunt nulla est enim consequat non consectetur Ut Ut dolore laborum id dolore commodo officia deserunt fugiat dolor proident esse occaecat sed labore dolor minim adipisicing ex dolore pariatur nostrud anim consequat esse incididunt nulla officia velit commodo ea velit cillum ea deserunt dolor magna reprehenderit laboris dolor cupidatat velit nulla dolore ut in minim Ut et esse nisi dolor non ex in dolor minim amet nisi cupidatat magna incididunt adipisicing qui dolore dolore et laboris in amet proident mollit sint sit aute qui fugiat nulla voluptate mollit veniam voluptate in in incididunt id sint id veniam est id veniam qui labore mollit proident Ut dolore laborum eu culpa laborum aliquip elit minim cillum ex nostrud id officia eiusmod Excepteur Duis quis veniam magna occaecat aliquip dolor nostrud occaecat consectetur nulla dolore sit nisi exercitation fugiat nostrud Duis ut cupidatat quis laborum officia magna voluptate sit in dolor in voluptate magna voluptate in minim commodo Excepteur in ad aliqua amet Ut Duis amet amet laborum consequat aliquip sit do ex nostrud fugiat id laborum minim culpa consequat elit.' };
	$scope.contributionData.createdAt = new Date("2017-04-16T04:04:52.436Z")

	var count = 0; 
    simulateData = function(){

    	var user = $scope.users[count];

		if(user.name == "Patrick Janssen")
			console.log("patrick");
		else{
			if(user.id !== undefined){
				$scope.contributionData.author = user.id
				$scope.contributionData.title = "FinalSubmission" + "-" + user.name
				$scope.createNewContribution();
				
			}
		}

		count++;
		console.log(count);

    }


	//$scope.contributionData = { 'tags': [] };

	$scope.tag = "";
	$scope.addTag = function(tag){

		$scope.contributionData.tags.push(tag || $scope.tag)
		$scope.tag = "";
	}

	$scope.createNewContribution = function(){

		$scope.contributionData.contentType  = "text";

		$http({
				  method  : 'POST',
				  url     : '/api/contributions/',
				  data    : $scope.contributionData,  // pass in data as strings
				  headers : { 'Content-Type': 'application/json' }  // set the headers so angular passing info as form data (not request payload)
				 })
				.success(function(data) {
					alert("Contribution Created");  
					refresh();  

				})
		
	}


	/*
	 *	To create simulated groups
	 * 
	 */
	$scope.groupData = { 
		    name: "",
			description: "",
			restricted: false,
			groupParentId: "-1",
			author:  null,
			createdAt: null
	};

	$scope.createNewGroup = function(){
		
		$http({
				  method  : 'POST',
				  url     : '/api/groups/',
				  data    : $scope.groupData,  // pass in data as strings
				  headers : { 'Content-Type': 'application/json' }  // set the headers so angular passing info as form data (not request payload)
				 })
				.success(function(data) {
				    
					alert("Group Created", JSON.stringify(data));  
					refresh();  

				})

	}


	/*
     *
     *	Create new user
     *
     * 
	 */
	$scope.userDataJSON = "";
	$scope.userData = { 
		    name: "",
			nusOpenId: "",
			addedBy: "",
			addedOn: "",
			isAdmin: false
	};

	$scope.createNewUser = function(){

		if($scope.userDataJSON){
			// different post requests for each user
			if( eval($scope.userDataJSON) ){
				var users =  eval($scope.userDataJSON);
				for(var i=0; i < users.length; i++){

					var user = users[i];
					var userData = {
						name :  user.name, 
						nusOpenId: user.nusOpenId, 
						addedBy: $scope.userData.addedBy,
						addedOn: $scope.userData.addedOn,
						isAdmin: false
					}
					postUser(userData);

				}
			}
			else{
				alert("Invalid data");
			}
			
		}
		else{

			postUser($scope.userData);
			
		}

		function postUser(user){
			$http({
					  method  : 'POST',
					  url     : '/api/users/',
					  data    : user,  
					  headers : { 'Content-Type': 'application/json' }  // set the headers so angular passing info as form data (not request payload)
					 })
					.success(function(data) {
					    
						alert("User Created");  
						refresh();  

					})
		}

	}

	/*
	 * 		Create new link
	 */
	$scope.linkData = {	};
	simulateLink = function(){

		var user = Math.floor(Math.random()*$scope.users.length);
		if($scope.users[user].id !== undefined){
			$scope.linkData.createdBy = $scope.users[user].id;
			console.log($scope.users[user].name)
		}

		var rels = $scope.relationships.filter(function(r){ return r.src_type == 'contribution' && r.target_type=='contribution'})
		var rel = Math.floor(Math.random()*rels.length);
		if($scope.relationships[rel] !== undefined){
			$scope.linkData.relationshipName = $scope.relationships[rel].name;
			console.log($scope.linkData.relationshipName)
		}

		var source = Math.floor(Math.random()*$scope.contributions.length);
		if($scope.contributions[source].id !== undefined){
			$scope.linkData.source = $scope.contributions[source].id;
			console.log($scope.contributions[source].title)
		}
		
		var target = Math.floor(Math.random()*$scope.contributions.length);
		if($scope.contributions[target].id !== undefined){
			$scope.linkData.target = $scope.contributions[target].id;
			console.log($scope.contributions[target].title)
		}

		if( $scope.linkData.target != $scope.linkData.source)
			$scope.createLink();
		else
			simulateLink();

	}
	$scope.createLink = function(){

			$http({
					  method  : 'POST',
					  url     : '/api/relationships/',
					  data    : $scope.linkData,  
					  headers : { 'Content-Type': 'application/json' }  // set the headers so angular passing info as form data (not request payload)
					 })
					.success(function(data) {
					    
						//alert("Link Created");  
						refresh();  

					})

	}






	refresh();

}]);
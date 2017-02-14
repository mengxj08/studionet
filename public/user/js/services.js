// ------------- Services
angular.module('studionet')

	//-------------------- Supernodes
	// This service returns the group and contribution super node IDs
	.factory('supernode', ['$http', function($http){
		var o ={
			group: -1, 
			contribution: -1
		};

		o.getSupernodes = function(){
			return $http.get('/api/supernode').success(function(data){
				o.group = data.groupId; 
				o.contribution = data.contributionId; 
			});
		};

		return o;
	}])


	// --------------- User List
	.factory('users', ['$http', function($http){

		var o = {
			users: [],
			usersHash: []
		};

		// Fetches the array of users
		// { "name":"user name","isAdmin":true,"avatar":"/assets/images/avatar.png","activityArr":[51,13,8],"id":0,"lastLoggedIn":1486715262183,"level":7.8500000000000005,"nickname":null }
		// activityArr - Viewed, Rated, Created
		o.getAll = function(){
			return $http.get('/api/users').success(function(data){

				// convert all names to title case
				for(var i=0; i < o.users.length; i++){
					var u = o.users[i];
					u.name = u.name.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
				}

				angular.copy(data, o.users);
				o.usersHash = o.users.hash();

			});
		};

		// Takes in two arguments - userID anf from DB
		// Fetches details about a particular user from the database 
		// get user from the hash and trigger data request for additional info about the user from the server
		o.getUser = function(user_id, fromDB){
			
			var user = o.usersHash[user_id];

			// trigger for user data
			if(fromDB){

				var url = '/api/users/' + user_id;
				
				return $http.get(url).then(function(res){
					if(res.status == 200){
						var data = res.data;
						var user = o.usersHash[data.id];

						for(prop in data){
							if(data.hasOwnProperty(prop)){
								user[prop] = data[prop];
							}
						}		
						return res;
					}
					else{
						console.log("Error fetching user data");
					}
				});
			
			}
			else
				return user;
		}

		// ---- Sets updated user-information
		o.setUser = function(user_data){
			o.usersHash[user_data.id] = user_data;
			console.warn("set user used in services.js");
			return true;		
		}

		// ----- Creates a new user 
		// Admin Only Function
		o.createNewUser = function(user){
			return $http.post('/api/users', user).success(function(data){
				o.users.push(data);
				o.usersHash[data.id] = data;
			});
		}

		return o;
	}])


	// --------------- Tag List
	.factory('tags', ['$http', '$filter', function($http, $filter){

		var o = {
			tags: [], 
			tagsHash: undefined
		};

		// {"name":"@newgroup","id":4401,"contributionCount":0,"createdBy":8,"restricted":"true","group":4400}
		o.getAll = function(){
			return $http.get('/api/tags').success(function(data){
				angular.copy($filter('orderBy')(data, 'contributionCount', true) , o.tags);
				tagsHash = data.hash();
			});
		};

		return o;
	}])


	//----------------  Groups List
	.factory('groups', ['$http', function($http){
		var o = {
			groups: [],
		};

		o.getAll = function(){
			return $http.get('/api/groups').success(function(data){
				angular.copy(data, o.groups);
			});
		};

		return o;
	}])


	// --------------- Contributions List
	.factory('contributions', ['$http', 'supernode', function($http, supernode){

		var o = {
			contributions: [],
			contributionsHash : undefined
		};

		// Gets an array of all contributions
		// {"id":77,"totalRatings":0,"dateCreated":1483423740000,"rating":0,"rateCount":0,"views":0,"createdBy":11,"title":"Documentation - StudioNET"}
		o.getAll = function(){
			console.warn("get All contributions was called");
			return $http.get('/api/contributions').success(function(data){

				// Remove supernode contribution
				// If first element, remove immediately, else use a filter 
				if(data[0].id == supernode.contribution)
					data.shift(1);
				else{
					data = data.filter(function(c){
						if(c.id == supernode.contribution){
							return false;
						}
						else
							return true;
					})			
				}

				angular.copy(data, o.contributions);
				o.contributionsHash = data.hash();

				return data;
			});
		};

		// Get additional data about a particular contribution from the database
		// {"body":"<p>Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas</p>",
		//  "ratingArray":[0,0,0,0,0], "lastUpdated":1488513780000, "tags":null, "totalRating":0, "ref":5, "id":104, "dateCreated":1488513780000, "contentType":null, 
		//  "rating":0,"rateCount":0,"views":29,"createdBy":7,"edited":null,"title":"Assignment 6","attachments":[{"attachment":null,"id":null}]}
		o.getContribution = function(id){
			return $http.get('/api/contributions/' + id).success(function(data){
				angular.copy(data, o.contributionsHash[id].db_data);
			});
		};


		return o;
	}])


	//--------------------- Profile
	.factory('profile', ['$http', 'users', function($http, users){
		
		var o ={
			user: {},
			activity: [],
		};

		// ----------------- Observers of this service which re-run when this data is refreshed
		var observerCallbacks = [];

		// register an observer
		o.registerObserverCallback = function(callback){
		   observerCallbacks.push(callback);
		};

		// call this when you know 'foo' has been changed
		var notifyObservers = function(){
			angular.forEach(observerCallbacks, function(callback){
		    	 callback();
		    });
		};


		// ----------------- Refreshes User 
		// profile.user: Basic details about the user - 
		// 				canEdit, avatar, name, id, addedOn, filterNames, filters, joinedOn, lastLogged In, nickname
		// 				contributions(with id, rating, rateCount, views, title), 
		// 				groups(id, role, joinedOn)
		// 				tags, 
		// 				
		// profile.getUser() : This service refreshes the above data 
		// 
		o.getUser = function(){
			return $http.get('/api/profile/').success(function(data){
				angular.copy(data, o.user);
				notifyObservers();
			});
		};


		// ----------------- Fetches all activity for the user
		// End refers to the contribution (later, link) Id 
		// [ [ {"start":8,"end":4623,"type":"CREATED","properties":{},"id":5224},{"start":8,"end":4622,"type":"CREATED","properties":{},"id":5220} ] ]
		// CREATED : 
		// VIEWED : "properties":{"lastViewed":1487044949737,"views":1}
		// RATED : "properties":{"rating":3,"lastRated":1486385685468}
		o.getActivity = function(){
			return $http.get('/api/profile/activity').success(function(data){
				angular.copy(data[0], o.activity);
			});
		};

		// Todo
		o.changeName = function(user){
		  	return $http({
				  method  : 'PUT',
				  url     : '/api/profile/',
				  data    : user,  // pass in data as strings
				  headers : { 'Content-Type': 'application/json' }  // set the headers so angular passing info as form data (not request payload)
				 })
				.success(function(data) {
					
					o.user = data;
					users.setUser(o.user);

				})
		};

		// Todo
		o.changePicture = function(){
			
		};

		return o;
	}])


	// ----------------- Deals with attachments (deleting)
	// Not yet used
	.factory('attachments', ['$http', function($http){
		var o = {
			attachments: []
		}

		o.deleteAttachmentbyId = function(contributionId, attachmentId){
			return $http.delete('/api/contributions/'+contributionId+'/attachments/'+attachmentId)
			.success(function(res) {
				return;  
		    })
		    .error(function(error){
				throw error;
		    })
		}

		return o;
	}])

	
	// ----------------- Deals with individual contribution functionalities
	.factory('contribution', ['$http', 'profile', 'contributions', 'tags', 'GraphService', function($http, profile, contributions, tags, GraphService){

		var o = { }

		// ??
		o.getContribution = function(id){
			
			var node = GraphService.graph.getElementById(id);

			if(node.data('db_data') == undefined){
				contributions.getContribution(id).then(function(res){

				  node.data( 'db_data', tagCorrectionFn(res.data) );
				  console.log('fetched data');
				});					
			}
			else
				console.log("data already defined");
		}

		// ---- Create a contribution
		// Data needs to be sent in FormData format
		o.createContribution = function(new_contribution){

			var formData = new FormData();
			formData.append('title', new_contribution.title);
			formData.append('body', new_contribution.body);
			formData.append('tags', new_contribution.tags);
			formData.append('refType', new_contribution.refType);
			formData.append('contentType', new_contribution.contentType);
			formData.append('ref', new_contribution.ref);

			new_contribution.attachments.map(function(file){	formData.append('attachments', file, file.name); 	})

		    return $http({
					method  : 'POST',
					url     : '/api/contributions',
					headers : { 'Content-Type': undefined, 'enctype':'multipart/form-data; charset=utf-8' },
					processData: false,
					data: formData
		    })
		    .success(function(res) {

					// refresh graph
					// should come as a socket input
					GraphService.getGraph().then(function(){	GraphService.selectNode(res.id);	});

					// refresh tags
					// should be updated by the socket connection
					tags.getAll();
					
					// refresh profile
					profile.getUser();

					// refresh contributions
					contributions.getAll();

		    })
		    .error(function(error){
				throw error;
		    }) 
		}

		// ---- Updates a contribution
		// Data needs to be sent in FormData format 
		// Fix me!
		o.updateContribution = function(update_contribution){

			var formData = new FormData();
			formData.append('title', update_contribution.title);
			formData.append('body', update_contribution.body);
			formData.append('tags', update_contribution.tags);
			formData.append('contentType', update_contribution.contentType);
			formData.append('ref', update_contribution.ref);

			update_contribution.attachments.map(function(file){
				formData.append('attachments', file, file.name);
			})

			return $http({
				  method  : 'PUT',
				  url     : '/api/contributions/'+ update_contribution.id,
				  headers : { 'Content-Type': undefined, 'enctype':'multipart/form-data; charset=utf-8' },
	      	      processData: false,
	              data: formData
				 })
				.then(function(res) {

					GraphService.selectNode(update_contribution.id);
					GraphService.graph.getElementById(update_contribution.id).data('db_data', update_contribution);
					GraphService.graph.getElementById(update_contribution.id).data('name', update_contribution.title);
					
					// refresh graph
					// graph.getGraph().then(function(){	graph.selectNode(update_contribution.id);	});

					// refresh tags
					tags.getAll();
					
					// refresh profile
					profile.getUser();

					// refresh contributions
					contributions.getAll();

					// send success
					return res;  
				})	
		}

		// ---- Deletes a contribution
		// Confirmation Testing happens here
		o.deleteContribution = function(contribution_id){

			var r = confirm("Are you sure you want to delete your node? This action cannot be undone.");
	        if (r == true) {
		        return $http({
						method  : 'delete',
						url     : '/api/contributions/' + contribution_id,
						data    : {},  // pass in data as strings
						headers : { 'Content-Type': 'application/json' }  // set the headers so angular passing info as form data (not request payload)
						})
			    .success(function(res) {

					// remove node from graph
					GraphService.removeNode(contribution_id)

					// refresh tags
					tags.getAll();
					
					// refresh profile
					profile.getUser();

					// refresh contributions
					contributions.getAll();

			    })
			    .error(function(error){
					throw error;
			    })	
			}
			else
				console.log("Error Deleting");
		}

		// ---- Updates view count of a contribution in the ContributionsHash
		o.updateViewCount = function(id){
			return $http.post('/api/contributions/' + id + '/view').success(function(data){
				contributions.contributionsHash[id].views++;
			});
		};

		o.rateContribution = function(id, rating){
			return $http.post('/api/contributions/' + id + '/rate', {'rating': rating} ).success(function(data){
				profile.getActivity();
			});
		};

		return o;
	}])
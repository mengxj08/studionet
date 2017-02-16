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

				angular.copy(data, o.users);
				o.usersHash = o.users.hash();

				// convert all names to title case
				for(var i=0; i < o.users.length; i++){
					var u = o.users[i];
					u.name = u.name.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
				}

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

	// ------------------------ To be used later
angular.module('studionet')
	.factory('groups', ['$http', 'profile', function($http, profile){

		var o = {
			groups: [],
			graph: {}
		};

		o.getAll = function(){
			return $http.get('/api/groups').success(function(data){
				angular.copy(data, o.groups);
				//console.log("Groups Refreshed");
			});
		};

		o.getGraph = function(user_context){
	    	
			/*return $http.get('/graph/all/groups').success(function(data){
				// replace the nodes with the groups that already hold data about the user status in each group
				
				data.nodes = o.groups;
				// copy data
				angular.copy(data, o.graph);
			});*/
		};

		o.createNewGroup = function(group){
			return $http.post('/api/groups', group).then(function(response){
				
				var data = response.data;

				//console.log("new group created", data);
				
				// refresh groups, the user
				o.getAll();

				profile.getUser();

				return data; 
			
			}, function(error){

				throw error;
			
			});

		}

		o.updateCreate = function( data ){
			
			// update groups
			groups.groups.push(data);
		}

		o.updateDelete = function( data ){
			// update groups
			groups.groups = groups.groups.filter( function(grp){
				//console.log(data, "deleted");
				return grp.id != data.id;
			})
		}

		return o;
	}])

	.factory('group', ['$http', 'profile', 'groups', 'supernode', 'users', function($http, profile, groups, supernode, users){

		var o = {
			group: {},
			users: [],
			user_status: undefined
		};

		var cache = [];

		o.getGroupInfo = function(id){
			return $http.get('/api/groups/' + id).success(function(data){
						
						data.requestingUserStatus = undefined;

						// fix me - find a better way
					/*	for(var i=0; i < profile.user.groups.length; i++){
							if( data.id == profile.groups[i].id ){
									data.requestingUserStatus = profile.groups[i].role;
							}
						}*/

						angular.copy(data, o.group);

						cache[id] = data;



			});		


		};

		o.getGroupUsers = function(id){
			//console.log("getting users");
			return $http.get('/api/groups/' + id + '/users').success(function(data){
				angular.copy(data, o.users);

				//o.getGroupPotentials(id);
			});
		};

		/*	o.updateContribution = function(groupDetails){
				return $http.put('/api/groups/'+groupDetails.groupId, groupDetails).success(function(){
					$("#successMsg").show();
					
				});
			};*/

		o.joinGroup = function(){
			return $http.get('/api/groups/' + o.group.id + '/join').success(function(data){
				
				// push the group - id, name, role
				profile.groups.push( {id: o.group.id, name: o.group.name, role: "Member"});

				// fix status in groups & graph
				groups.groups = groups.groups.map(function(group){
					if(group.id == o.group.id){
						group.requestingUserStatus = "Member";
					}

					return group;
				})
				groups.graph.nodes = group.groups;
				
				//
				//console.log("joined group", o.group)
			});
		}

		o.leaveGroup = function(){
			return $http.get('/api/groups/' + o.group.id + '/leave').success(function(data){
				
				// remove the group from groups id
				profile.groups = profile.groups.filter( function(obj){ return obj.id!= data.id } );

				// fix status in groups & graph
				groups.groups = groups.groups.map(function(group){
					if(group.id == data.id){
						group.requestingUserStatus = undefined;
					}

					return group;
				})
				//groups.graph.nodes = groups.groups;

				// 
				//console.log("Removed from group", data)

			});
		}

		o.addGroupMember = function(data){
			return $http.post('/api/groups/' + o.group.id + '/users', data).success(function(res){
					
				o.group.users.push({ id: data.users[0] })

			});

		};

		o.removeGroupMember = function(data){

			return $http({
			    method: 'DELETE',
			    url: '/api/groups/' + o.group.id + '/users',
			    data: data,
			    headers: {
			        'Content-type': 'application/json;charset=utf-8'
			    }
			}).success( function(res){

				o.group.users = o.group.users.filter( function(user){

					return !(user.id == data.users[0])

				})

			})
		}

		o.updateGroup = function(data){

			return $http({
				  method  : 'PUT',
				  url     : '/api/groups/' + data.id,
				  data    : data,  // pass in data as strings
				  headers : { 'Content-Type': 'application/json' }  // set the headers so angular passing info as form data (not request payload)
				 })
				.success(function(data) {

					//o.getGroupInfo().then( function(){ o.getGroupUsers() });
					//console.log("Group edited", data);

					return (data);
				})

		}

		o.deleteGroup = function(){

			return $http.delete('/api/groups/' + o.group.id ).success(function(data){
					
					//groups.updateDelete( data );

			});		
		}

		return o;
	}])

	.factory('relationships', ['$http', function($http){
		var o = {
			relationships: []
		};

		o.getAll = function(){
			$http.get('/api/relationships/').success(function(data){
				angular.copy(data, o.relationships);
			});
		}

		return o;
	}])

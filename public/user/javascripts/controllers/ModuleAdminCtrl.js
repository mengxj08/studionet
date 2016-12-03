angular.module('studionet')

.controller('ModuleAdminCtrl', ['$scope', 'module', 'users', function($scope, module, users){
	$scope.moduleInfo = module.module;
	$scope.moduleUsers = module.users;
	$scope.allUsers = users.users;

	$scope.addUser = function(){
		
		module.addStudent({
			userId: $scope.userId,
			moduleId: $scope.moduleInfo.id,
			moduleRole: 'student'
			
		});
	};

	$scope.updateModuleContribution = function(){
		console.log($("#newContributionTypes").val());
		module.updateContribution({
			moduleId: $scope.moduleInfo.id,
			name: $scope.moduleInfo.name,
			code: $scope.moduleInfo.code,
			contributionTypes: $("#newContributionTypes").val()
		});
	};
}]);

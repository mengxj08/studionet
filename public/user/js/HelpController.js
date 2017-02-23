angular.module('studionet')

.controller('HelpController', ['$scope', '$uibModalInstance',
                               function($scope, $uibModalInstance){

    $scope.close = function(){
		$uibModalInstance.dismiss({$value: 'close'});
    }


}]);
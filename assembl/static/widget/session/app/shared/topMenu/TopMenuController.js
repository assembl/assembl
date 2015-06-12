'use strict';

TopMenuModule.controller('TopMenuController', ['$scope','$stateParams', function($scope, $stateParams){

    $scope.urlLink = $scope.$parent.$state.params.config;

}]);
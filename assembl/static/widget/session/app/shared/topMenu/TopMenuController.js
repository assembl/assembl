'use strict';

TopMenuModule.controller('TopMenuController', ['$scope','$stateParams', function($scope, $stateParams){

    //console.debug($scope.$parent.$state.params.config);

    $scope.urlLink = $scope.$parent.$state.params.config;

}]);
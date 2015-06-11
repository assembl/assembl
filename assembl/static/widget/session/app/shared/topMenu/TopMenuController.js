'use strict';

TopMenuModule.controller('TopMenuController', ['$scope','$rootScope', function($scope, $rootScope){

    var config = 'local:Widget/2';

    $scope.home = '#/index?config=' + config;
    $scope.rating = '#/rating?config=' + config;
    $scope.edition = '#/edit?config=' + config;

}]);
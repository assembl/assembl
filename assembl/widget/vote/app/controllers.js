"use strict";

voteApp.controller('indexCtl',
  ['$scope', '$http', '$routeParams', '$log', 'globalConfig', 'configTestingService', 'configService', 'Discussion',
  function($scope, $http, $routeParams, $log, globalConfig, configTestingService, configService, Discussion){

    // intialization code (constructor)

    $scope.init = function(){
      console.log("indexCtl::init()");

      $scope.settings = configService.settings;
      console.log("settings:");
      console.log($scope.settings);
    }

}]);

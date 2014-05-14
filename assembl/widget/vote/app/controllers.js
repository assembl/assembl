"use strict";

voteApp.controller('indexCtl',
  ['$scope', '$http', '$routeParams', '$log', 'globalConfig', 'Discussion',
  function($scope, $http, $routeParams, $log, globalConfig, Discussion){

    // intialization code (constructor)

    $scope.init = function(){
      console.log("indexCtl::init()");
    }

}]);

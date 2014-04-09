"use strict";

creativityApp.controller('videosController',[function(){

}]);

creativityApp.controller('cardsController',['$scope','$http','globalConfig','$parse', function($scope, $http, globalConfig){

    globalConfig.fetch().success(function(data){

         $scope.cards = data.cards;
    });

    $scope.shuffle = function(){

        $scope.cards.shift();
    }




}]);
"use strict";

creativityApp.controller('videosCtl',[function(){

}]);

creativityApp.controller('cardsCtl',['$scope','$http','globalConfig', function($scope, $http, globalConf){

    globalConf.fetch().success(function(data){

         $scope.cards = data.cards;
    });

    $scope.shuffle = function(){

        $scope.cards.shift();
    }

    $scope.flippingCard = function() {


    }

}]);

creativityApp.controller('creativitySessionCtl', ['$scope', function($scope){



}]);

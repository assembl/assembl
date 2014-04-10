"use strict";

creativityApp.controller('videosCtl',[function(){

}]);

creativityApp.controller('cardsCtl',['$scope','$http','globalConfig', function($scope, $http, globalConf){

    //data mock
    globalConf.fetch().success(function(data){
         $scope.cards = data.card_game;
    });

    $scope.shuffle = function(){
        //$scope.card_game.shift();
    }

    $scope.flippingCard = function() {


    }

}]);

creativityApp.controller('creativitySessionCtl', ['$scope','globalConfig','globalMessages', function($scope, globalConf, globalMessages){

    //data mock
    globalConf.fetch().success(function(data){
        $scope.cards = data.card_game;
    });

    //data mock
    globalMessages.fetch().success(function(data){
        $scope.ideas = data.ideas;
    });

}]);

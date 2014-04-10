"use strict";

creativityApp.controller('videosCtl',[function(){

}]);

creativityApp.controller('cardsCtl',['$scope','$http','globalConfig', function($scope, $http, globalConf){

    //data mock
    globalConf.fetch().success(function(data){
         $scope.cards = data.card_game;
    });

    $scope.shuffle = function(index){
        $scope.cards[index].shift();

        if($scope.cards[index].length < 1){
            //TODO: refactoring
            globalConf.fetch().success(function(data){
                $scope.cards = data.card_game;
            });
        }

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

    $scope.vote = function(){



    }

}]);

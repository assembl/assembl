'use strict';

var RateModule = angular.module('RateModule', ['ui.router']);

RateModule.config(['$stateProvider', function($stateProvider) {
    $stateProvider
        .state('session.rate',{
            url: '/rate',
            templateUrl: 'app/components/rate/RateView.html',
            controller: 'RateController'
        });
}]);
'use strict';

var HomeModule = angular.module('HomeModule', ['ui.router']);

HomeModule.config(['$stateProvider', function($stateProvider) {
    $stateProvider
        .state('session.home',{
            url: '/home',
            templateUrl: 'app/components/home/HomeView.html',
            controller: 'HomeController'
        });
}]);
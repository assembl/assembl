'use strict';

var RateModule = angular.module('RateModule', ['ui.router']);

RateModule.config(['$stateProvider', function($stateProvider) {
    $stateProvider
        .state('session.rate',{
            url: '/rate?config',
            templateUrl: 'app/components/rate/RateView.html',
            controller: 'RateController',
            activetab: 'rate',
            resolve: {
                config: ['WidgetService','$stateParams', function(WidgetService, $stateParams){
                    if($stateParams.config){
                        var id = decodeURIComponent($stateParams.config).split('/')[1];
                        return WidgetService.get({id: id}).$promise;
                    }else{
                        console.warn('no config param set');
                    }
                }]
            }
        });
}]);

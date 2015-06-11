"use strict";

var SessionApp = angular.module('appSession', [
    'TopMenuModule',
    'AdminModule',
    'HomeModule',
    'RateModule',
    'ngSanitize',
    'ngResource',
    'ui.router',
    'pascalprecht.translate',
    'angular-growl',
    'mgcrea.ngStrap.datepicker']);


SessionApp.run(['$rootScope', '$state', '$stateParams', 'IdeaService',
    function($rootScope, $state, $stateParams, IdeaService) {

        $rootScope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState) {

            if(toParams.idea){

                var id =  toParams.idea.split('/')[1],
                    ideaService = IdeaService.get({id: id}).$promise;

                ideaService.then(function(idea){
                    $rootScope.idea = idea;
                })
            }

        });

        // Make state information available to $rootScope, and thus $scope in our controllers
        $rootScope.$state = $state;
        $rootScope.$stateParams = $stateParams;

        $state.go('session.admin');

}]);


SessionApp.config(['$resourceProvider', '$stateProvider', '$urlRouterProvider','$translateProvider','$locationProvider','growlProvider',
    function($resourceProvider, $stateProvider, $urlRouterProvider, $translateProvider, $locationProvider, growlProvider){

    // Don't strip trailing slashes from REST URLs
    //$resourceProvider.defaults.stripTrailingSlashes = false;

    $stateProvider
        .state('session',{
           url: '',
           abstract: true,
           views: {
             'topMenu@':{
                templateUrl:'app/shared/topMenu/TopMenuView.html',
                controller:'TopMenuController'
             },
             '': {
                templateUrl: 'index.html'
             }
           }

        });

    $translateProvider.useStaticFilesLoader({
        prefix: 'locales/',
        suffix: '.json'
    });

    $translateProvider.preferredLanguage('fr');

    /**
     * Set growl position and timeout
     * */
    growlProvider.globalPosition('top-center');
    growlProvider.globalTimeToLive(5000);

    /**
     * Display an unique error message for the same type of error
     * */
    growlProvider.onlyUniqueMessages(true);

}]);
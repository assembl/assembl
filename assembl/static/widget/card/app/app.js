"use strict";

var appCards = angular.module('appCards',
    ['ngRoute', 'ngSanitize', 'creativityServices', 'pascalprecht.translate', 'angular-growl']);

appCards.config(['$routeProvider', '$translateProvider', '$locationProvider', 'growlProvider',
    function ($routeProvider, $translateProvider, $locationProvider, growlProvider) {

        $locationProvider.html5Mode(false);

        $routeProvider.
            when('/', {
                templateUrl: 'app/partials/cards.html',
                controller: 'cardsCtl',
                resolve: {
                    app: function ($route, configService) {
                        return configService.getWidget($route.current.params.config);
                    }
                }
            });

        $translateProvider.useStaticFilesLoader({
            prefix: 'app/locales/',
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
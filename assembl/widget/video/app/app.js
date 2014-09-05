"use strict";

var videosApp = angular.module('videosApp',
    ['ngRoute', 'ngSanitize', 'creativityServices', 'pascalprecht.translate', 'angular-growl']);

videosApp.config(['$routeProvider', '$translateProvider', '$locationProvider', 'growlProvider',
    function ($routeProvider, $translateProvider, $locationProvider, growlProvider) {

        $locationProvider.html5Mode(false);

        $routeProvider.
            when('/', {
                templateUrl: 'app/partials/videos.html',
                controller: 'videosCtl',
                resolve: {
                    app: function ($route, configService) {
                        return configService.getWidget($route.current.params.config);
                    },
                    init: function (JukeTubeVideosService) {
                        JukeTubeVideosService.init();
                    }
                }
            })

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
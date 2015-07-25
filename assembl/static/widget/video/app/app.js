"use strict";

var videosApp = angular.module('videosApp',
    ['ngRoute', 'ngSanitize', 'creativityServices', 'pascalprecht.translate', 'angular-growl']);

videosApp.config(['$routeProvider', '$translateProvider', '$locationProvider', 'growlProvider',
    function($routeProvider, $translateProvider, $locationProvider, growlProvider) {

      $locationProvider.html5Mode(false);

      $routeProvider.
            when('/', {
              templateUrl: 'app/partials/videos.html',
              controller: 'videosCtl',
              resolve: {
                app: function($route, configService) {
                  console.log("$route.current.params:", $route.current.params);
                  if ("idea" in $route.current.params)
                      return configService.populateFromUrl($route.current.params.idea, 'idea');
                  if ("config" in $route.current.params)
                      return configService.populateFromUrl($route.current.params.config, 'widget');
                  console.log("Error: no 'config' or 'idea' URL parameter given");
                  return null;
                },
                init: function(JukeTubeVideosService) {
                  JukeTubeVideosService.init();
                }
              }
            });

      /**
       * Set growl position and timeout
       * */
      growlProvider.globalPosition('top-center');
      growlProvider.globalTimeToLive(5000);

      /**
       * Display an unique error message for the same type of error
       * */
      growlProvider.onlyUniqueMessages(true);

    }

]);

// returns the value of a given parameter in the URL of the current page
function getUrlVariableValue(variable) {
  var query = window.location.search.substring(1);
  var vars = query.split("&");
  for (var i = 0; i < vars.length; i++) {
    var pair = vars[i].split("=");
    if (pair[0] == variable) {
      return pair[1];
    }
  }

  //alert('Query Variable ' + variable + ' not found');
  return null;
}

videosApp.config(['$translateProvider', function($translateProvider) {
  $translateProvider.useStaticFilesLoader({
    prefix: 'app/locales/',
    suffix: '.json'
  });

  // language detection and fallbacks

  $translateProvider.fallbackLanguage('en');
  $translateProvider.registerAvailableLanguageKeys(['en', 'fr'], {
    'en_US': 'en',
    'en_UK': 'en',
    'de_DE': 'en',
    'de': 'en',
    'de_CH': 'en',
    'en-US': 'en',
    'en-UK': 'en',
    'de-DE': 'en',
    'de-CH': 'en',
    'fr_FR': 'fr',
    'fr-fr': 'fr',
  });

  //$translateProvider.preferredLanguage('fr'); // no, we want to use one of the available languages
  //$translateProvider.determinePreferredLanguage(); // not enough: any language not listed in registerAvailableLanguageKeys() won't use fallback, resulting in translation keys appearing on the page
  var getLocale = function() {
      var nav = window.navigator;
      return (nav.language || nav.browserLanguage || nav.systemLanguage || nav.userLanguage || '').split('-').join('_');
    };
  var localeOrFallback = function(locale) {
    if (locale && locale.length && locale.length > 2)
        locale = locale.substring(0, 2);
    locale = locale.toLowerCase();
    if (locale != 'fr')
        locale = 'en';
    return locale;
  };
  $translateProvider.determinePreferredLanguage(function() {
    var locale;
    var localeInUrl = getUrlVariableValue("locale");
    console.log("localeInUrl: ", localeInUrl);
    if (localeInUrl)
        locale = localeInUrl;
    else
        locale = getLocale();
    locale = localeOrFallback(locale);
    return locale;
  });

}]);

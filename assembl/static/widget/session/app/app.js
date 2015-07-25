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
    'mgcrea.ngStrap.datepicker',
    'mgcrea.ngStrap.timepicker']);

SessionApp.run(['$rootScope', '$state', '$stateParams',
    function($rootScope, $state, $stateParams) {

      var locale = window.navigator.userLanguage || window.navigator.language;
      moment.locale(locale);

      $rootScope.$on('$stateChangeStart', function(event, toState, toStateParams) {
        $rootScope.destinationState = toState;
        $rootScope.destinationParams = toStateParams;
      });

      $rootScope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState) {
        $rootScope.destinationState = toState;
      });

      // Make state information available to $rootScope, and thus $scope in our controllers
      $rootScope.$state = $state;
      $rootScope.$stateParams = $stateParams;

      $state.go('session.admin');

    }]);

SessionApp.config(['$resourceProvider', '$stateProvider', '$urlRouterProvider', '$locationProvider', 'growlProvider',
    function($resourceProvider, $stateProvider, $urlRouterProvider, $locationProvider, growlProvider) {

      // Don't strip trailing slashes from REST URLs
      //$resourceProvider.defaults.stripTrailingSlashes = false;

      $stateProvider
        .state('session', {
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

SessionApp.config(['$translateProvider', function($translateProvider) {
  $translateProvider.useStaticFilesLoader({
    prefix: 'locales/',
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
    console.log("=> locale used: ", locale);
    return locale;
  });

}]);

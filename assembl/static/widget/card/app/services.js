"use strict";

var widgetServices = angular.module('creativityServices', ['ngResource']);

widgetServices.service('AssemblToolsService', ['$window', '$rootScope', '$log', function($window, $rootScope, $log) {
  this.resourceToUrl = function(str) {
    var start = "local:";
    if (str && str.indexOf(start) == 0) {
      str = "/data/" + str.slice(start.length);
    }

    return str;
  };

  this.urlToResource = function(str) {
    var startSlash = "/data/";
    var startUri = "local:";
    if (str && str.indexOf(startSlash) == 0) {
      str = startUri + str.slice(startSlash.length);
    }

    return str;
  };
}]);

widgetServices.factory('localConfig', function($http) {

  var api_rest = 'config/local.json';

  return {
    fetch: function() {
      return $http.get(api_rest);
    }
  }

});

widgetServices.service('WidgetService', ['$window', '$rootScope', '$log', '$http', function($window, $rootScope, $log, $http) {

  this.putJson = function(endpoint, post_data, result_holder) {
    console.log("putJson()");

    $http({
      method: 'PUT',
      url: endpoint,
      data: post_data,

      //data: $.param(post_data),
      headers: {'Content-Type': 'application/json'}

      //headers: {'Content-Type': 'application/x-www-form-urlencoded'}
    }).success(function(data, status, headers) {
      console.log("success");
      if (result_holder)
          result_holder.text("Success!");
      console.log("data:");
      console.log(data);
      console.log("status:");
      console.log(status);
      console.log("headers:");
      console.log(headers);
    }).error(function(status, headers) {
      console.log("error");
      if (result_holder)
          result_holder.text("Error");
    });
  };

}]);

/**
 * CARD GAME
 * */
widgetServices.factory('cardGameService', function($http) {
  return {
    getCards: function(number) {
      var url = 'config/game_' + number + '.json';
      return $http.get(url);
    },
    getGenericDeck: function(pseudo_url) {
      var url = pseudo_url;
      if (/^http:\/\//.test(url))
          url = url.slice(5); // so that the url starts with "//" and so is fine with a widget hosted both on a http and https server
      else if (/^https:\/\//.test(url))
          url = url.slice(6); // same
      return $http.get(url);
    },
    available_decks: [
            {
              "label": "Deck 1",
              "url": "/static/widget/card/config/game_1.json" // we use "/static/widget/card/config/game_1.json" instead of "config/game_1.json", because this way it can be accessed from the session widget
            },
            {
              "label": "Deck 2",
              "url": "/static/widget/card/config/game_2.json"
            },
            {
              "label": "Deck 3",
              "url": "/static/widget/card/config/game_3.json"
            }
        ]
  };
});

/**
 * Resolve configuration before access to a controller
 * */
widgetServices.factory('configService', function($q, $http, utils, AssemblToolsService) {
  return {
    data: {},
    populateFromUrl: function(url, fieldname) {
      console.log("populateFromUrl(", url, " ", fieldname);
      var defer = $q.defer(),
          data = this.data;

      if (!url) {
        defer.reject({message: 'invalid url configuration'});
        return defer.promise;
      }

      var urlRoot = utils.urlApi(url);
      console.log("urlRoot: ", urlRoot);

      $http.get(urlRoot).success(function(response) {
        if (fieldname)
            data[fieldname] = response;
        else
            data = response;
        defer.resolve(data);
      }).error(function(data, status) {
        console.log("error while accessing URL: ", data, status);
        if (status === 401)
        {
          utils.notification();
        }

        defer.reject({message: 'error to get widget information'});
      });

      return defer.promise;
    }
  }
});

/**
 * CARD inspire me: send an idea to assembl
 * */
widgetServices.factory('sendIdeaService', ['$resource', function($resource) {
  return $resource('/api/v1/discussion/:discussionId/posts')
}]);

/**
 * WIP: use Angular's REST and Custom Services as our Model for Messages
 * */
widgetServices.factory('DiscussionService', ['$resource', function($resource) {
  return $resource('/data/Discussion/:discussionId');
}]);

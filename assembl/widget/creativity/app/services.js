"use strict";

creativityApp.factory('cardConfig', function($http){

    var API_URI = 'https://api.mongolab.com/api/1/databases/angularjs-intro/collections/users?apiKey=terrPcifZzn01_ImGsFOIZ96SwvSXgN9';

    return {

        fetch : function() {
            return $http.get(API_URI);
        }
    }

});
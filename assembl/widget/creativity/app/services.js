"use strict";

creativityApp.factory('globalConfig', function($http){

    // test url to retrieve json
    var API_URI = 'https://api.mongolab.com/api/1/databases/angularjs-intro/collections/users?apiKey=terrPcifZzn01_ImGsFOIZ96SwvSXgN9';

    var testApi = 'test/test.json';

    return {

        fetch : function() {
            return $http.get(testApi);
        }
    }

});
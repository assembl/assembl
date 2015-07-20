/**
 * Resolve configuration before access to a controller
 * */
SessionApp.factory('ConfigService', function ($q, $http, UtilsService) {
    return {
        data: {},
        getWidget: function (url) {

            var defer = $q.defer(),
                data = this.data;

            if (!url) defer.reject({message: 'invalid url configuration'});

            var urlRoot = UtilsService.getURL(url);

            $http.get(urlRoot).success(function (response) {
                data.widget = response;

                defer.resolve(data);
            }).error(function (data, status) {

                if (status === 401) UtilsService.notification();

                defer.reject({message: 'error to get widget information'});
            });

            return defer.promise;
        }
    }
});
/**
 * CARD GAME
 * */
appSession.factory('cardGameService', function($http){
    return {
        getCards: function(number){
            var url = 'config/game_'+number+'.json';
            return $http.get(url);
        }
    }
});

/**
 * Resolve configuration before access to a controller
 * */
appSession.factory('configService', function($q, $http, utils, $location){
    return {
        data: {},
        getWidget: function(url){
            var defer = $q.defer(),
                data = this.data;

            if(!url) defer.reject({message:'invalid url configuration'});

            var urlRoot = utils.urlApi(url);

            $http.get(urlRoot).success(function(response){
                data.widget = response;

                var
                    endDate = new Date(data.widget.settings.session.endDate),
                    currentDate = new Date(),
                    userPermission = data.widget.user_permissions;

                console.log(userPermission)
                console.log(_.contains(userPermission, 'admin_discussion'))

                if((currentDate > endDate) &&
                    !_.contains(userPermission, 'admin_discussion')){
                    //TODO: end of session



                }

                defer.resolve(data);
            }).error(function(data, status){

                if(status === 401) utils.notification();

                defer.reject({message:'error to get widget information'});
            });

            return defer.promise;
        }
    }
});
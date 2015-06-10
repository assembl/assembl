/**
 * CARD GAME
 * */
SessionApp.factory('CardGameService', function ($http) {
    return {
        getCards: function (number) {
            var url = 'config/game_' + number + '.json';
            return $http.get(url);
        }
    }
});

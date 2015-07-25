/**
 * CARD GAME
 * */
SessionApp.factory('CardGameService', function($http) {
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
              "url": "/static/widget/card/config/game_1.json"
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

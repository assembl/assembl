"use strict";

creativityApp.controller('videosCtl', ['$scope', '$http', 'globalVideoConfig', function($scope, $http, globalVideoConfig){
    
    // intialization code
    $scope.init = function(){
        // set model fields
        $scope.inspiration_keywords = [
            "modèle commercial",
            "freemium",
            "modèle d'affaires",
            "entreprise",
            "stratégie",
            "omg"
        ];

        // data mock
        globalVideoConfig.fetch().success(function(data){
             $scope.globalVideoConfig = data;
        });


        // initialize the select2 textfield
        $("#query").select2({
            tags: $scope.inspiration_keywords,
            tokenSeparators: [",", " "],
            formatNoMatches: function(term){return '';},
            //minimumResultsForSearch: -1
            selectOnBlur: true,
            minimumInputLength: 1,
        });
    }

    $scope.keywordClick = function($event){
        var keyword_value = $($event.target).html();
        var values = $("#query").select2("val");
        var alreadyThere = false;
        for ( var i = 0; i < values.length; ++i )
        {
          if ( values[i] == keyword_value )
          {
            alreadyThere = true;
            break;
          }
        }
        if ( false == alreadyThere )
        {
          values.push( keyword_value );
          $("#query").select2("val", values );
          $($event.target).css('display', 'none');
          //$(el.target).css('background', '#000');
        }
    }

    $scope.gapiLoaded = function(){
        console.log('gapiLoaded');
        console.log(gapi);
        gapi.client.setApiKey($scope.globalVideoConfig.youtube_api_key);
        gapi.client.load('youtube', 'v3', $scope.handleAPILoaded);
    }

    // After the API loads, call a function to enable the search box.
    $scope.handleAPILoaded = function(){
        console.log('handleAPILoaded');
      $('#search-button').attr('disabled', false);
    }

    
    // Search for a specified string.
    $scope.searchClick = function(){
        var q = $('#query').val();
        
        var request = gapi.client.youtube.search.list({
            q: q,
            part: 'snippet'
        });

        request.execute(function(response) {
            //var str = JSON.stringify(response.result);
            //$('#search-container').html('<pre>' + str + '</pre>');
            $scope.displayResults(response);
        });
        
        /* alternative way of making a search, without using the Google API library
        $http.get('https://www.googleapis.com/youtube/v3/search', {
          params: {
            key: $scope.globalVideoConfig.youtube_api_key,
            type: 'video',
            maxResults: '8',
            part: 'snippet',
            q: q
          }
        })
        .success( function (data) {
          $scope.displayResults(data);
        })
        .error( function () {
          console.log('Search error');
        });
        */
    }

    $scope.displayResults = function(response){
      var str = '';
      var nresults = 0;
      if ( response.result && response.result.items )
      {
        var sz = response.result.items.length;
        for ( var i = 0; i < sz; ++i )
        {
          var item = response.result.items[i];
          if ( item.id && item.id.kind && item.id.kind == 'youtube#video' )
          {
            ++nresults;
            /*
            str += '<li><a href="http://youtube.com/watch?v=' + item.id.videoId + '" target="_blank">'
              + '<img src=' + item.snippet.thumbnails.default.url + ' />'
              + item.snippet.title
              + '</a></li>';
            */
            str += '<li><div class="video-thumbnail"><iframe type="text/html" width="320" height="190" src="http://www.youtube.com/embed/'
              + item.id.videoId + '?autoplay=0" frameborder="0"/></div><div class="video-description">'
              //+ item.snippet.title + '<br/>'
              + '<div class="centered"><button>Cette vidéo m\'inspire</button></div></div></li>';
            }
        }
        str = '<ul>' + str + '</ul>';
      }
      if ( nresults == 0 )
      {
        str = 'No result';
      }
      $('#videos .search-container').html(str);
    }
    

    $scope.init();

}]);

creativityApp.controller('cardsCtl',
    ['$scope','$http','globalConfig', function($scope, $http, globalConf){

    //data mock
    globalConf.fetch().success(function(data){
         $scope.cards = data.card_game;
    });

    $scope.shuffle = function(index){
        $scope.cards[index].shift();

        if($scope.cards[index].length < 1){
            //TODO: refactoring
            globalConf.fetch().success(function(data){
                $scope.cards = data.card_game;
            });
        }

    }

    $scope.flippingCard = function() {}

}]);

creativityApp.controller('creativitySessionCtl',
    ['$scope','globalConfig','globalMessages', function($scope, globalConf, globalMessages){

    //data mock
    globalConf.fetch().success(function(data){
        $scope.cards = data.card_game;
    });

    //data mock
    globalMessages.fetch().success(function(data){
        $scope.ideas = data.ideas;
    });

    $scope.vote = function(){}

}]);

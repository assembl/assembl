"use strict";

creativityApp.controller('videoDetailCtl',
  ['$scope', '$http', '$routeParams', '$sce', 'globalVideoConfig',
  function($scope, $http, $routeParams, $sce, globalVideoConfig){

  // intialization code

  $scope.videoId = $routeParams.videoId;
  // TODO: sanitize URL
  $scope.videoUrl = $sce.trustAsResourceUrl('http://www.youtube.com/embed/' + $scope.videoId + '?autoplay=0');


  // activate the right tab
  $(".container ul.nav li").removeClass("active");
  $(".container ul.nav li a[href=\"#videos\"]").closest("li").addClass("active");

}]);


creativityApp.controller('videosCtl',
  ['$scope', '$http', '$routeParams', 'globalVideoConfig', 'Discussion', 
  function($scope, $http, $routeParams, globalVideoConfig, Discussion){
    
    // intialization code

    $scope.init = function(){
        // set model fields

        $scope.inspiration_keywords = [
            "modèle commercial",
            "freemium",
            "modèle d'affaires",
            "entreprise",
            "stratégie"
        ];

        // get config file URL given as parameter of the current URL
        $scope.configFile = $routeParams.config;

        // data mock

        globalVideoConfig.fetch().success(function(data){
             $scope.globalVideoConfig = data;
        });

        $scope.discussion = Discussion.get({discussionId: 1}, function(discussion) {
          console.log(discussion);
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


        // activate the right tab
        $(".container ul.nav li").removeClass("active");
        $(".container ul.nav li a[href=\"#videos\"]").closest("li").addClass("active");

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
              + '<div class="centered"><a href="#/video/'+ item.id.videoId + '" class="btn btn-default" role="button">Cette vidéo m\'inspire</a></div></div></li>';
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

    // initialize empty stack (LIFO) of already displayed cards, so that the user can browse previously generated cards
    $scope.displayed_cards = [];
    $scope.displayed_card_index = 0;

    //data mock
    globalConf.fetch().success(function(data){
        $scope.cards = data.card_game[0]; // we get only the first deck of cards
        $scope.shuffle();
    });

    // activate the right tab
    $(".container ul.nav li").removeClass("active");
    $(".container ul.nav li a[href=\"#cards\"]").closest("li").addClass("active");

    $scope.shuffle = function(){
        var n_cards = $scope.cards.length;
        if ( n_cards > 0 )
        {
            var random_index = Math.floor((Math.random()*n_cards));
            $scope.displayed_cards.push($scope.cards[random_index]);
            $scope.cards.splice(random_index,1);
            $scope.displayed_card_index = $scope.displayed_cards.length-1;
        }
    }

    $scope.previousCard = function(){
        $scope.displayed_card_index = Math.max(0, $scope.displayed_card_index-1);
    }
    $scope.nextCard = function(){
        $scope.displayed_card_index = Math.min($scope.displayed_cards.length-1, $scope.displayed_card_index+1);
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

    // activate the right tab
    $(".container ul.nav li").removeClass("active");
    $(".container ul.nav li a[href=\"#session\"]").closest("li").addClass("active");

    $scope.vote = function(){}

}]);

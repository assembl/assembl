"use strict";

creativityApp.controller('videosCtl',
  ['$scope', '$http', '$routeParams', '$log', 'globalVideoConfig', 'JukeTubeVideosService', 'Discussion', 
  function($scope, $http, $routeParams, $log, globalVideoConfig, JukeTubeVideosService, Discussion){

    // intialization code (constructor)

    $scope.init = function(){

      // set model fields

      $scope.youtube = JukeTubeVideosService.getYoutube();
      $scope.results = JukeTubeVideosService.getResults();
      $scope.playlist = true;

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


      // initialize the Select2 textfield

      $("#query").select2({
          tags: $scope.inspiration_keywords,
          tokenSeparators: [",", " "],
          formatNoMatches: function(term){return '';},
          //minimumResultsForSearch: -1
          selectOnBlur: true,
          minimumInputLength: 1
      });


      // activate the right tab

      $("ul.nav li").removeClass("active");
      $("ul.nav li a[href=\"#videos\"]").closest("li").addClass("active");


      // load youtube script

      if ( JukeTubeVideosService.getYoutube().ready === true )
        JukeTubeVideosService.onYouTubeIframeAPIReady();
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

    $scope.launch = function (id, title) {
      JukeTubeVideosService.launchPlayer(id, title);
      $log.info('Launched id:' + id + ' and title:' + title);
    };

    $scope.search = function () {
      var q = $('#query').val();
      $http.get('https://www.googleapis.com/youtube/v3/search', {
        params: {
          key: 'AIzaSyC8lCVIHWdtBwnTtKzKl4dy8k5C_raqyK4', // quentin
          type: 'video',
          maxResults: '8',
          part: 'id,snippet',
          fields: 'items/id,items/snippet/publishedAt,items/snippet/title,items/snippet/description,items/snippet/thumbnails/default,items/snippet/channelTitle',
          q: q
        }
      })
      .success( function (data) {
        JukeTubeVideosService.listResults(data);
        $log.info(data);
      })
      .error( function () {
        $log.info('Search error');
      });
    }
}]);

creativityApp.controller('cardsCtl',
    ['$scope','$http','$sce','globalConfig', function($scope, $http, $sce, globalConf){

    // activate the right tab
    $("ul.nav li").removeClass("active");
    $("ul.nav li a[href=\"#cards\"]").closest("li").addClass("active");

    $scope.formData = {};

    // initialize empty stack (LIFO) of already displayed cards, so that the user can browse previously generated cards
    $scope.displayed_cards = [];
    $scope.displayed_card_index = 0;

    //data mock
    globalConf.fetch().success(function(data){
        $scope.cards = data.card_game[0]; // we get only the first deck of cards
        $scope.shuffle();
    });

    $scope.shuffle = function(){
        var n_cards = $scope.cards.length;
        if ( n_cards > 0 )
        {
            var random_index = Math.floor((Math.random()*n_cards));
            $scope.displayed_cards.push($scope.cards[random_index]);
            $scope.displayed_card_index = $scope.displayed_cards.length-1;
            $scope.displayed_cards[$scope.displayed_card_index].html_content = $sce.trustAsHtml($scope.cards[random_index].html_content);
            $scope.cards.splice(random_index,1);
        }
    }

    $scope.previousCard = function(){
        $scope.displayed_card_index = Math.max(0, $scope.displayed_card_index-1);
    }

    $scope.nextCard = function(){
        $scope.displayed_card_index = Math.min($scope.displayed_cards.length-1, $scope.displayed_card_index+1);
    }

    /*
     * Comment an idea from inspire me
     * TODO:  add rest api
    */
    $scope.sendIdea = function(){


    }

}]);

creativityApp.controller('creativitySessionCtl',
    ['$scope','globalConfig','globalMessages', function($scope, globalConf, globalMessages){

    // activate the right tab
    $("ul.nav li").removeClass("active");
    $("ul.nav li a[href=\"#session\"]").closest("li").addClass("active");

    $scope.formData = {};

    $('.session-comment .vote').popover();

    //data mock
    globalConf.fetch().success(function(data){
        $scope.cards = data.card_game;
    });

    //data mock
    globalMessages.fetch().success(function(data){
        $scope.ideas = data.ideas;
    });


    /* Send a new idea from creativity session */
    $scope.sendNewIdea = function(){
        if($scope.formData) {
            console.log($scope.formData)
        }
    }

    /*
     * Comment an idea from creativity session
     * TODO:  add rest api
     */
    $scope.commentIdea = function(){

        if($scope.formData) {
            console.log($scope.formData)
        }

    }

}]);

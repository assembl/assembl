"use strict";

creativityApp.controller('videosCtl',
  ['$scope', '$http', '$routeParams', '$log', 'localConfig', 'JukeTubeVideosService', 'Discussion',
  function($scope, $http, $routeParams, $log, localConfig, JukeTubeVideosService, Discussion){

    // intialization code (constructor)

    $scope.init = function(){

      // set model fields

      $scope.youtube = JukeTubeVideosService.getYoutube();
      $scope.results = JukeTubeVideosService.getResults();
      $scope.pageInfo = JukeTubeVideosService.getPageInfo();
      $scope.playlist = true;

      $scope.inspiration_keywords = [
          "modèle commercial",
          "freemium",
          "modèle d'affaires",
          "entreprise",
          "stratégie"
      ];

      $scope.inspiration_keywords_related = [
          "modèle économique",
          "low cost",
          "avantage compétitif",
          "établissement",
          "tactique"
      ];


      // get config file URL given as parameter of the current URL

      $scope.configFile = $routeParams.config;


      // data mock

      localConfig.fetch().success(function(data){
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
          minimumInputLength: 1,
          width: '70%'
      });

      // make recommended keywords re-appear on top when they are removed from the search field
      $("#query").on("change", function(e){
        if ( e.removed )
        {
          if ( $scope.inspiration_keywords.indexOf(e.removed.text) >= 0 || $scope.inspiration_keywords_related.indexOf(e.removed.text) >= 0 )
          {
            $("#results .keywords .keyword:contains(\""+e.removed.text.replace(/"/g, '\\"')+"\")").show();
          }
          
        }
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
          $($event.target).hide();
          //$(el.target).css('background', '#000');
        }
    }

    $scope.scrollToPlayerAndLaunch = function (id, title) {
      $("html, body").animate({scrollTop: $("#player").offset().top - 10}, "slow");
      $scope.launch(id, title);
    };

    $scope.launch = function (id, title) {
      JukeTubeVideosService.launchPlayer(id, title);
      $log.info('Launched id:' + id + ' and title:' + title);
    };

    $scope.search = function (pageToken) {
      var q = $('#query').val();
      var params = {
        key: 'AIzaSyC8lCVIHWdtBwnTtKzKl4dy8k5C_raqyK4', // quentin
        type: 'video',
        maxResults: '10',
        part: 'id,snippet',
        fields: 'items/id,items/snippet/publishedAt,items/snippet/title,items/snippet/description,items/snippet/thumbnails/default,items/snippet/channelTitle,nextPageToken,prevPageToken,pageInfo',
        q: q
      };
      if ( pageToken )
        params.pageToken = pageToken;

      $http.get('https://www.googleapis.com/youtube/v3/search', {
        params: params
      })
      .success( function (data) {
        JukeTubeVideosService.processResults(data);
        $scope.results = JukeTubeVideosService.getResults();
        $scope.pageInfo = JukeTubeVideosService.getPageInfo();
        $log.info(data);
      })
      .error( function () {
        $log.info('Search error');
      });
    }
}]);

creativityApp.controller('cardsCtl',
    ['$scope','$http','$sce','localConfig','sendIdeaService','$location', function($scope, $http, $sce, localConfig, sendIdeaService){

    // activate the right tab
    $("ul.nav li").removeClass("active");
    $("ul.nav li a[href=\"#cards\"]").closest("li").addClass("active");

    $scope.formData = {};

    // initialize empty stack (LIFO) of already displayed cards, so that the user can browse previously generated cards
    $scope.displayed_cards = [];
    $scope.displayed_card_index = 0;

    //data mock
    localConfig.fetch().success(function(data){
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
       var send =  new sendIdeaService();
       //var url = $location.protocol()+'://'+$location.host()+':'+$location.port()

       send.subject = $scope.formData.title;
       send.message = $scope.formData.description;

       //TODO : {discussionId} need to be dynamic
       send.$save({discussionId:3}, function sucess(){

       }, function error(){

       })
    }

}]);

creativityApp.controller('creativitySessionCtl',
    ['$scope','cardGame','$rootScope', '$timeout','$http',
        function($scope, cardGame, $rootScope, $timeout, $http){

    // activate the right tab
    $("ul.nav li").removeClass("active");
    $("ul.nav li a[href=\"#session\"]").closest("li").addClass("active");

    $scope.formData = {};

    /**
     * Due to the latency to init $rootScope we need a delay
     * */
    $timeout(function(){

        $scope.getSubIdeaFromIdea();

    },500);

    $scope.$watch("message", function(value){

        switch(value){
            case 'sendNewIdea:success':
                $scope.getSubIdeaFromIdea();
                break;
            case 'sendNewIdea:error':
                break;

        }
    });

    /**
     * Fetch all ideas newly added
     */
    $scope.getSubIdeaFromIdea = function(){

        var rootUrl = $rootScope.widgetConfig.ideas_uri;
            rootUrl = '/data/'+ rootUrl.split(':')[1] +'?view=default';
        var ideas = [],
            user_id = $rootScope.widgetConfig.user['@id'].split('/')[1];

        console.log($rootScope.widgetConfig)


        $http.get(rootUrl).then(function(response){
            angular.forEach(response.data, function(item){

                if(item.widget_add_post_endpoint){

                    item.widget_add_post_endpoint = '/data/'+item.widget_add_post_endpoint.split(':')[1];
                    item.creationDate = moment(item.creationDate).fromNow();
                    item.avatar = '/user/id/'+user_id+'/avatar/40';
                    item.username = $rootScope.widgetConfig.user.name;

                    ideas.push(item);
                }
            })

            $scope.ideas = ideas.reverse();
        })
    }

    /**
    * @params type {string}
    * @params short_title {string}
    * @params definition {string}
    * */
    $scope.sendSubIdea = function(){
        if($scope.formData) {

            var rootUrl = $rootScope.widgetConfig.ideas_uri;
                rootUrl = '/data/'+ rootUrl.split(':')[1];

            $scope.formData.type = 'Idea';

            $http({
                method:'POST',
                url:rootUrl,
                data:$.param($scope.formData),
                headers: {'Content-Type': 'application/x-www-form-urlencoded'}
            }).success(function(data, status, headers){

                $scope.message = "sendNewIdea:success";

            }).error(function(status, headers){

                $scope.message = "sendNewIdea:error";

            });
        }
    }

    /**
    * Sum each value from session vote
    */
    $scope.totalVote = function(){
        var el = angular.element('.session-comment .total-score');

        angular.forEach(el, function(v){
            var elm = angular.element(v);

            console.log("idea id :" + elm.attr('id') +" vote :"+ elm.val() );

        });

    }


    /**
     * Load config card
     */
    cardGame.getCards(1).success(function(data){
        $scope.game = data;
    });

    /**
     * Card random
     * */
    $scope.shuffle = function(){

        var m = $scope.game.game.length, t, i;

        while (m) {

            // Pick a remaining element…
            i = Math.floor(Math.random() * m--);

            // And swap it with the current element.
            t = $scope.game.game[m];
            $scope.game.game[m] = $scope.game.game[i];
            $scope.game.game[i] = t;
        }
    }

}]);

creativityApp.controller('ratingCtl',
    ['$scope', 'cardGame', function($scope, cardGame){
    /**
     * Load config card
     */
    //cardGame.getCards(1).success(function(data){});

}]);

creativityApp.controller('editCardCtl',
    ['$scope','loadCard', function($scope, loadCard){

    $scope.editCard = "Welcome"
    $scope.game = [];

    $scope.addCardGame = function(){
      var obj = {
          card:'new game'
      };

      $scope.game.push(obj);

    }

    $scope.$watch('game', function(){

    }, true)

    loadCard.readFile();


}]);
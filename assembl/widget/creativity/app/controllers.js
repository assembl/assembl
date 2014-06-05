"use strict";

creativityApp.controller('videosCtl',
  ['$scope', '$http', '$routeParams', '$log', '$resource', 'localConfig', 'JukeTubeVideosService', 'Discussion', 'sendIdeaService', 'WidgetConfigService', 'AssemblToolsService',
  function($scope, $http, $routeParams, $log, $resource, localConfig, JukeTubeVideosService, Discussion, sendIdeaService, WidgetConfigService, AssemblToolsService){

    // intialization code (constructor)

    $scope.init = function(){
      console.log("videosCtl::init()");
      //console.log("WidgetConfigService:");
      //console.log(WidgetConfigService);


      // set default model fields

      $scope.youtube = JukeTubeVideosService.getYoutube();
      $scope.results = JukeTubeVideosService.getResults();
      $scope.pageInfo = JukeTubeVideosService.getPageInfo();
      $scope.playlist = true;
      $scope.idea = {
        shortTitle: "Idea short title",
        longTitle: "Idea long title"
      };
      $scope.discussion = {
        topic: "Discussion topic"
      };

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

      $scope.inspiration_keywords_used = {};


      // get inspiration keywords from the idea URL given in the configuration JSON

      var idea_api_url = AssemblToolsService.resourceToUrl(WidgetConfigService.settings.idea) + '?view=creativity_widget';
      var discussion_api_url = 'discussion api url';

      var Idea = $resource(idea_api_url);
      var Discussion = null;
      $scope.idea = Idea.get({}, function(){ // this function is executed once the AJAX request is received and the variable is assigned
        $scope.inspiration_keywords = $scope.idea.most_common_words;
        $scope.inspiration_keywords_used = {};

        // get discussion from the idea
        discussion_api_url = AssemblToolsService.resourceToUrl($scope.idea.discussion);
        Discussion = $resource(discussion_api_url);
        $scope.discussion = Discussion.get({}, function(){
          console.log("discussion:");
          console.log($scope.discussion);
        });


        // fill the search bar with the 2 first keywords and submit the search

        setFirstKeywordsAsQuery();
        $scope.search();

      });


      // get config file URL given as parameter of the current URL

      $scope.configFile = $routeParams.config;


      // data mock

      localConfig.fetch().success(function(data){
          $scope.globalVideoConfig = data;
      });

      /*
      $scope.discussion = Discussion.get({discussionId: 1}, function(discussion) {
          console.log(discussion);
      });
      */


      // hide right panel

      $("#player").css("visibility","hidden");


      // initialize the Select2 textfield

      $("#query").select2({
          tags: [], //$scope.inspiration_keywords, // not used anymore, because the dropdown is now hidden
          tokenSeparators: [",", " "],
          formatNoMatches: function(term){return '';},
          //minimumResultsForSearch: -1
          selectOnBlur: true,
          minimumInputLength: 1,
          width: '70%'
      });
      setFirstKeywordsAsQuery();


      // make recommended keywords re-appear on top when they are removed from the search field

      $("#query").on("change", function(e){
        $scope.$apply(function(){
          if ( e.removed )
          {
            /* now handled by ng-show of Angluar in the HTML template
            if ( $scope.inspiration_keywords.indexOf(e.removed.text) >= 0 || $scope.inspiration_keywords_related.indexOf(e.removed.text) >= 0 )
            {
              $("#results .keywords .keyword:contains(\""+e.removed.text.replace(/"/g, '\\"')+"\")").show();
            }
            */

            if ( $scope.inspiration_keywords_used[e.removed.text] != undefined )
            {
              delete $scope.inspiration_keywords_used[e.removed.text];
            }
            
          }
          else if ( e.added )
          {
            $scope.inspiration_keywords_used[e.added.text] = true;
          }
        });
      });


      // activate the right tab

      $("ul.nav li").removeClass("active");
      $("ul.nav li a[href=\"#videos\"]").closest("li").addClass("active");


      // load youtube script

      if ( JukeTubeVideosService.getYoutube().ready === true )
        JukeTubeVideosService.onYouTubeIframeAPIReady();

    };

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
          $scope.inspiration_keywords_used[keyword_value] = true;
          values.push( keyword_value );
          $("#query").select2("val", values );
          //$($event.target).hide(); // now handled by ng-show of Angluar in the HTML template
          //$(el.target).css('background', '#000');
        }
    };

    var setFirstKeywordsAsQuery = function(){
      console.log("setFirstKeywordsAsQuery()");
      var values = [];
      if ($scope.inspiration_keywords.length > 0)
      {
        values.push($scope.inspiration_keywords[0]);
        $scope.inspiration_keywords_used[$scope.inspiration_keywords[0]] = true;
      }
      if ($scope.inspiration_keywords.length > 1)
      {
        values.push($scope.inspiration_keywords[1]);
        $scope.inspiration_keywords_used[$scope.inspiration_keywords[1]] = true;
      }
      console.log("prefill:" + values[0] + " " + values[1]);
      $("#query").select2("val", values);
    };

    $scope.scrollToPlayerAndLaunch = function (id, title) {
      // show right panel
      $("#player").css("visibility","visible");

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

    $scope.sendIdea = function(){
      var send =  new sendIdeaService();

      send.subject = $("#messageTitle").val();
      send.message = $("#messageContent").val();

      //TODO : {discussionId} need to be dynamic
      send.$save({discussionId:3}, function sucess(){
        alert("Your message has been successfully posted.");
      }, function error(){
        alert("Error: your message has not been posted.");
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
    ['$scope','cardGame','$rootScope', '$timeout','$http','growl',
        function($scope, cardGame, $rootScope, $timeout, $http, growl){

    // activate the right tab
    $("ul.nav li").removeClass("active");
    $("ul.nav li a[href=\"#session\"]").closest("li").addClass("active");

    $scope.formData = {};

    /**
     * Due to the latency to init $rootScope we need a delay
     * */
    $timeout(function(){

        $scope.getSubIdeaFromIdea();

    },1000);

    $scope.$watch("message", function(value){

        switch(value){
            case 'sendNewIdea:success':
                $scope.getSubIdeaFromIdea();
                break;
            case 'sendNewIdea:error':
                break;

        }
    }, true);

    /**
     * Fetch all ideas newly added
     */
    $scope.getSubIdeaFromIdea = function(){

        var rootUrl = $rootScope.widgetConfig.ideas_uri;
            rootUrl = '/data/'+ rootUrl.split(':')[1];

        var user_id = $rootScope.widgetConfig.user['@id'].split('/')[1],
            ideas = [];

        $http.get(rootUrl).then(function(response){
            angular.forEach(response.data, function(item){

                if(item.widget_add_post_endpoint){

                    item.widget_add_post_endpoint = '/data/'+item.widget_add_post_endpoint.split(':')[1];
                    item.creationDate = moment(new Date(item.creationDate)).fromNow();
                    item.avatar = '/user/id/'+user_id+'/avatar/30';
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

                growl.success('New sub idea posted');

                $scope.message = "sendNewIdea:success";

                $scope.formData.short_title = null;
                $scope.formData.definition = null;

            }).error(function(status, headers){

                growl.error('Something wrong');

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
     * params {int} which is the id of the card game config/game_{int}.json
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
    ['$scope','$rootScope','$timeout','$http','growl',
        function($scope, $rootScope, $timeout, $http, growl){

    /**
     * Due to the latency to init $rootScope we need a delay
     * */
    $timeout(function(){

        $scope.getSubIdeaForVote();

    },800);

    /**
     * Fetch all ideas newly added
     */
    $scope.getSubIdeaForVote = function(){

        var rootUrl = $rootScope.widgetConfig.ideas_uri;
            rootUrl = '/data/'+ rootUrl.split(':')[1];

        var ideas = [];

        $http.get(rootUrl).then(function(response){
            angular.forEach(response.data, function(item){

                if(item.widget_add_post_endpoint){

                    ideas.push(item);
                }
            })

            $scope.ideas = ideas;
        });
    }

    /**
     * Valid votes and send to the server separetely
     * */
    $scope.validVote = function(){

        var subIdea = angular.element('#postVote .sub-idea'),
            commentSubIdea = angular.element('#postVote .comment-to-sub-idea');

        var rootUrlSubIdea = '/data/'+$rootScope.widgetConfig.confirm_ideas_uri.split(':')[1],
            rootUrlMessage = '/data/'+$rootScope.widgetConfig.confirm_messages_uri.split(':')[1],
            subIdeaSelected = [],
            commentSelected = [];


        $scope.$watch('message', function(value){
            //TODO: find a good translation for confirm that the catching sub idea is valid
            switch(value){
                case 'validVote:success':
                    growl.success('validVoteCatcher');
                    break;
                case 'validVote:error':
                    growl.error('errorVoteCatcher');
                    break;
                default:
                    break;
            }
        })

        angular.forEach(subIdea, function(idea){

            var elm = angular.element(idea);

            if($(elm).is(':checked')){

                subIdeaSelected.push($(idea).val());
            }
        })

        angular.forEach(commentSubIdea, function(comment){

            var elm = angular.element(comment);

            if($(elm).is(':checked')){

                commentSelected.push($(comment).val());
            }
        })

        if(commentSelected.length > 0){

            var obj = {};
                obj.ids = JSON.stringify(commentSelected);

            $http({
                method:'POST',
                url:rootUrlMessage,
                data:$.param(obj),
                async:true,
                headers: {'Content-Type': 'application/x-www-form-urlencoded'}
            }).success(function(data, status, headers){

                $scope.message = 'validVote:success';

            }).error(function(status, headers){

                $scope.message = 'validVote:error';
            });

        }

        if(subIdeaSelected.length > 0){

            var obj = {};
                obj.ids = JSON.stringify(subIdeaSelected);

            $http({
                method:'POST',
                url:rootUrlSubIdea,
                data:$.param(obj),
                async:true,
                headers: {'Content-Type': 'application/x-www-form-urlencoded'}
            }).success(function(data, status, headers){

                $scope.message = 'validVote:success';

            }).error(function(status, headers){

                $scope.message = 'validVote:error';
            });
        }

    }

    /**
     * Toggle on checkbox
     * */
    $scope.checked = function(e){
        var elm = angular.element(e.currentTarget);

        elm.toggleClass('checked');
    }


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
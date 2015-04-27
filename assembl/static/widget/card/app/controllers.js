"use strict";

appCards.controller('cardsCtl',
    ['$scope', '$http', '$sce', '$route', 'cardGameService', 'sendIdeaService', 'configService', 'AssemblToolsService', function ($scope, $http, $sce, $route, cardGameService, sendIdeaService, configService, AssemblToolsService) {

        // intialization code (constructor)

        $scope.init = function () {

            console.log("configService: ", configService);
            console.log("configService.data: ", configService.data);

            $scope.config = {};
            $scope.config.widget = configService.data.widget;
            $scope.config.idea = configService.data.idea;
            console.log("$scope.config: ", $scope.config);
            $scope.urlParameterConfig = $route.current.params.config; //$routeParams.config;
            console.log("$scope.urlParameterConfig: ", $scope.urlParameterConfig);
            if ( !$scope.config.widget && !$scope.config.idea )
            {
                console.log("Error: no config or idea given.");
            }
            $scope.canPost = true;
            $scope.canNotPostReason = null;

            $scope.sendMessageEndpointUrl = $scope.computeSendMessageEndpointUrl($scope.config, $scope.urlParameterConfig);
            console.log("$scope.sendMessageEndpointUrl: ", $scope.sendMessageEndpointUrl);
            if ( !$scope.sendMessageEndpointUrl ){
                $scope.canPost = false;
                $scope.canNotPostReason = "no_endpoint";
            }


            $scope.formData = {};

            // initialize empty stack (LIFO) of already displayed cards, so that the user can browse previously generated cards
            $scope.displayed_cards = [];
            $scope.displayed_card_index = 0;
            $scope.message_is_sent = false;

            cardGameService.getCards(1).success(function (data) {
                $scope.cards = data.game;
                //$scope.shuffle();
                $scope.shuffledCards = angular.copy($scope.cards);
                for ( var i = 0; i < $scope.shuffledCards.length; ++i )
                {
                    $scope.shuffledCards[i].originalIndex = i;
                    $scope.shuffledCards[i].body = $sce.trustAsHtml($scope.shuffledCards[i].body);
                }
                //console.log("$scope.shuffledCards before: ", $scope.shuffledCards);
                $scope.shuffleArray($scope.shuffledCards);
                //console.log("$scope.shuffledCards after: ", $scope.shuffledCards);
                $scope.pickNextCard();
            });

            // show previous and next card buttons when the mouse cursor is in the card zone
            $("#cards-container").hover(
                function () {
                    $("#previousCardButton").show();
                    $("#nextCardButton").show();
                },
                function () {
                    $("#previousCardButton").hide();
                    $("#nextCardButton").hide();
                }
            );
            $("#previousCardButton").hide();
            $("#nextCardButton").hide();
        };

        $scope.computeSendMessageEndpointUrl = function(config, widgetUri){
            console.log("config: ", config);
            console.log("config.idea.widget_add_post_endpoint: ", config.idea.widget_add_post_endpoint);
            var endpoints = null;
            var url = null;
            if ( "widget_add_post_endpoint" in config.idea)
                endpoints = config.idea.widget_add_post_endpoint;
            widgetUri = AssemblToolsService.urlToResource(widgetUri);
            console.log("widgetUri: ", widgetUri);
            if ( endpoints && Object.keys(endpoints).length > 0 )
            {
                if ( widgetUri in endpoints )
                {
                    url = AssemblToolsService.resourceToUrl(endpoints[widgetUri]);
                }
                else
                {
                    url = AssemblToolsService.resourceToUrl(endpoints[Object.keys(endpoints)[0]]);
                }
            }
            else
            {
                console.log("error: could not determine an endpoint URL to post message to");
            }
            return url;
        };

        $scope.resumeInspiration = function(){
            console.log("resumeInspiration()");
            $scope.message_is_sent = false;
        };

        $scope.exit = function(){
            console.log("exit()");
            window.parent.exitModal();
            console.log("called exitModal");
        };

        //+ Jonas Raoni Soares Silva
        //@ http://jsfromhell.com/array/shuffle [rev. #1]
        $scope.shuffleArray = function(v){
            for(var j, x, i = v.length; i; j = parseInt(Math.random() * i), x = v[--i], v[i] = v[j], v[j] = x);
            return v;
        };

        $scope.pickNextCard = function () {
            var n_cards = $scope.cards.length;
            if (n_cards > 0) {
                $scope.cards.splice(0, 1);
                $scope.displayed_card_index = $scope.displayed_cards.length;
                $scope.displayed_cards.push($scope.shuffledCards[$scope.displayed_card_index]);
                
            }
            //console.log("$scope.displayed_cards: ", $scope.displayed_cards);
            //console.log("$scope.displayed_card_index: ", $scope.displayed_card_index);
        }

        $scope.previousCard = function () {
            $scope.displayed_card_index = Math.max(0, $scope.displayed_card_index - 1);
        }

        $scope.nextCard = function () {
            $scope.displayed_card_index = Math.min($scope.displayed_cards.length - 1, $scope.displayed_card_index + 1);
        }

        /*
         * Comment an idea from inspire me
         */
        $scope.sendIdea = function () {
            console.log("sendIdea()");
            try {
                var messageSubject = $("#messageTitle").val();
                var messageContent = $("#messageContent").val();
                if ( !messageSubject || !messageContent ){
                    return;
                }
                var inspirationSourceUrl = "/static/widget/card/?#/card?card=" + $scope.displayed_cards[$scope.displayed_card_index].originalIndex;
                //var inspirationSourceTitle = "TODO"; // TODO: use this piece of info
                console.log("messageSubject: ", messageSubject);
                console.log("messageContent: ", messageContent);
                console.log("inspirationSourceUrl: ", inspirationSourceUrl);
                //console.log("inspirationSourceTitle: ", inspirationSourceTitle);

                var message = {
                    "type": "PostWithMetadata",
                    "message_id": 0,
                    "subject": messageSubject,
                    "body": messageContent,
                    "metadata_raw": '{"inspiration_url": "'+inspirationSourceUrl+'"}'
                };
                
                console.log("message: ", message);
                var url = $scope.sendMessageEndpointUrl;
                if ( !url )
                {
                    throw "no endpoint";
                }
                // an example value for url is "/data/Discussion/1/widgets/56/base_idea_descendants/4/linkedposts";
                // FIXME: error when http://localhost:6543/widget/video/?config=/data/Widget/40#/?idea=local:Idea%2F4%3Fview%3Dcreativity_widget => $scope.config.idea.widget_add_post_endpoint is an empty object

                //var url = utils.urlApi($scope.config.widget.ideas_url);
                console.log("url: ", url);
                $http({
                    method: 'POST',
                    url: url,
                    data: $.param(message),
                    headers: {'Content-Type': 'application/x-www-form-urlencoded'}
                }).success(function (data, status, headers, config) {
                    console.log("Success: ", data, status, headers, config);
                    /* commented out because we don't post an idea anymore, now we post a message
                    // save the association between the video and the comment in the widget instance's memory
                    var created_idea = headers("Location"); // "local:Idea/66"
                    $scope.associateVideoToIdea(created_idea, videoUrl, videoTitle);
                    */
                    
                    // tell the user that the message has been successfully posted
                    //alert("Your message has been successfully posted.");
                    $scope.message_is_sent = true;
                    $("#messageTitle").val("");
                    $("#messageContent").val("");
                }).error(function (data) {
                    console.log("Error: ", data);
                });
                console.log("done");
            }
            catch(err)
            {
                console.log("Error:", err);
            }
        };

    }]);

// display a single card (this page is referenced by the "inspiration source" link in a message)
// for example: http://localhost:6543/static/widget/card/?&locale=fr#/card?card=50
appCards.controller('cardCtl',
    ['$scope', '$http', '$sce', '$route', 'cardGameService', 'sendIdeaService', 'configService', 'AssemblToolsService', function ($scope, $http, $sce, $route, cardGameService, sendIdeaService, configService, AssemblToolsService) {

        // intialization code (constructor)

        $scope.init = function () {

            console.log("configService: ", configService);
            console.log("configService.data: ", configService.data);

            $scope.config = {};
            $scope.config.widget = configService.data.widget;
            $scope.config.idea = configService.data.idea;
            console.log("$scope.config: ", $scope.config);
            $scope.urlParameterConfig = $route.current.params.config; //$routeParams.config;
            console.log("$scope.urlParameterConfig: ", $scope.urlParameterConfig);
            if ( !$scope.config.widget && !$scope.config.idea )
            {
                console.log("Error: no config or idea given.");
            }

            // initialize empty stack (LIFO) of already displayed cards, so that the user can browse previously generated cards
            $scope.displayed_cards = [];
            $scope.displayed_card_index = 0;
            if ( "card" in $route.current.params )
            {
                var param = parseInt($route.current.params.card);
                if ( param !== NaN && param >= 0 )
                    $scope.displayed_card_index = param;
            }

            cardGameService.getCards(1).success(function (data) {
                $scope.cards = data.game;
                if ( $scope.displayed_card_index >= $scope.cards.length )
                    $scope.displayed_card_index = 0;
                $scope.card = $scope.cards[$scope.displayed_card_index];
                $scope.card.body = $sce.trustAsHtml($scope.card.body);
            });
        };

    }]);
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

            // download the deck of cards from widget settings, or from URL parameter
            var available_decks = cardGameService.available_decks;
            var default_deck_url = available_decks[0].url;
            $scope.deck_pseudo_url = default_deck_url; // for retro-compatibility
            if ( $scope.config.widget && "settings" in $scope.config.widget && "card_module_settings" in $scope.config.widget.settings && "deck_pseudo_url" in $scope.config.widget.settings.card_module_settings ){
                $scope.deck_pseudo_url = $scope.config.widget.settings.card_module_settings.deck_pseudo_url;
            } else if ( "deck" in $route.current.params ){
                $scope.deck_pseudo_url = $route.current.params.deck;
            }

            var deck_promise = cardGameService.getGenericDeck($scope.deck_pseudo_url);

            deck_promise.success(function (data) {
                $scope.cards = data.game;
                $scope.shuffledCards = angular.copy($scope.cards);
                for ( var i = 0; i < $scope.shuffledCards.length; ++i )
                {
                    $scope.shuffledCards[i].originalIndex = i;
                    $scope.shuffledCards[i].body = $sce.trustAsHtml($scope.shuffledCards[i].body);
                }
                $scope.shuffleArray($scope.shuffledCards);
                $scope.pickNextCard();
            }).error(function(){
                alert("Error: Could not load requested deck of cards: " + $scope.deck_pseudo_url);
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
                    console.log("The 'add post' endpoint corresponding to this widget has not been found in this idea's data, so we fall back to the 'add post' endpoint which corresponds to another widget associated to this idea.");
                    // But maybe we should not apply this fallback and return null instead
                    url = AssemblToolsService.resourceToUrl(endpoints[Object.keys(endpoints)[0]]);
                }
            }
            else
            {
                console.log("Error: Could not determine an endpoint URL to post a message to, corresponding to this idea.");
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
                var inspirationSourceUrl = "/static/widget/card/?#/card?deck=" + $scope.deck_pseudo_url + "&card=" + $scope.displayed_cards[$scope.displayed_card_index].originalIndex;
                //var inspirationSourceTitle = "TODO"; // TODO: use this piece of info
                console.log("messageSubject: ", messageSubject);
                console.log("messageContent: ", messageContent);
                console.log("inspirationSourceUrl: ", inspirationSourceUrl);
                //console.log("inspirationSourceTitle: ", inspirationSourceTitle);

                var message = {
                    "type": "WidgetPost",
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

            // deduce which deck of cards we should use
            $scope.deck_pseudo_url = cardGameService.available_decks[0].url;
            if ( "deck" in $route.current.params )
            {
                $scope.deck_pseudo_url = $route.current.params.deck;
            }

            cardGameService.getGenericDeck($scope.deck_pseudo_url).success(function (data) {
                $scope.cards = data.game;
                if ( $scope.displayed_card_index >= $scope.cards.length )
                    $scope.displayed_card_index = 0;
                $scope.card = $scope.cards[$scope.displayed_card_index];
                $scope.card.body = $sce.trustAsHtml($scope.card.body);
            });
        };

    }]);

// configure a card module
// for example: http://localhost:6543/static/widget/card/?&locale=fr#/admin_configure_instance?widget=...&target=...
appCards.controller('adminConfigureInstanceCtl',
    ['$scope', '$http', '$sce', '$route', 'cardGameService', 'sendIdeaService', 'configService', 'AssemblToolsService', 'WidgetService', function ($scope, $http, $sce, $route, cardGameService, sendIdeaService, configService, AssemblToolsService, WidgetService) {

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

            $scope.widget_uri = $scope.urlParameterConfig; // this is an alias (widget_uri is the name of the parameter which is used in the other types of widgets)
            $scope.target = "idea" in $route.current.params ? $route.current.params.idea : null; // this is also an alias

            $scope.widget_endpoint = AssemblToolsService.resourceToUrl($scope.widget_uri);

            $scope.available_decks = cardGameService.available_decks;

            $scope.selected_deck = null;
            $scope.selected_deck_other = null;

            // check radio button associated to currently selected deck (read from widget settings)
            var currently_selected_deck_pseudo_url = null;
            if ( $scope.config.widget && "settings" in $scope.config.widget && "card_module_settings" in $scope.config.widget.settings && "deck_pseudo_url" in $scope.config.widget.settings.card_module_settings ){
                currently_selected_deck_pseudo_url = $scope.config.widget.settings.card_module_settings.deck_pseudo_url;
            }
            if ( currently_selected_deck_pseudo_url ){
                var deck = _.find($scope.available_decks, function(el){
                    return ( "url" in el && el.url == currently_selected_deck_pseudo_url );
                });
                if ( deck ){
                    $scope.selected_deck = currently_selected_deck_pseudo_url;
                } else {
                    $scope.selected_deck = "other";
                    $scope.selected_deck_other = currently_selected_deck_pseudo_url;
                }
            }


            $("#widget_configure_instance").on("submit", function () {
                $scope.applyWidgetSettings($("#widget_configure_instance_result"));
            });
        };

        $scope.applyWidgetSettings = function(result_holder){
            console.log("applyWidgetSettings()");

            var endpoint = $scope.widget_endpoint + "/settings";
            var post_data = $scope.config.widget.settings;

            post_data.card_module_settings = {};
            var deck_pseudo_url = $scope.selected_deck;
            if ( deck_pseudo_url == 'other' )
                deck_pseudo_url = $scope.selected_deck_other;
            post_data.card_module_settings.deck_pseudo_url = deck_pseudo_url;

            WidgetService.putJson(endpoint, post_data, result_holder);
        };

    }]);
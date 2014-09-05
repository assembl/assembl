"use strict";

appCards.controller('cardsCtl',
    ['$scope', '$http', '$sce', 'cardGameService', 'sendIdeaService', function ($scope, $http, $sce, cardGameService, sendIdeaService) {

        // activate the right tab
        $("ul.nav li").removeClass("active");
        $("ul.nav li a[href=\"#cards\"]").closest("li").addClass("active");

        $scope.formData = {};

        // initialize empty stack (LIFO) of already displayed cards, so that the user can browse previously generated cards
        $scope.displayed_cards = [];
        $scope.displayed_card_index = 0;

        cardGameService.getCards(1).success(function (data) {
            $scope.cards = data.game;
            $scope.shuffle();
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

        $scope.shuffle = function () {
            var n_cards = $scope.cards.length;
            if (n_cards > 0) {
                var random_index = Math.floor((Math.random() * n_cards));
                $scope.displayed_cards.push($scope.cards[random_index]);
                $scope.displayed_card_index = $scope.displayed_cards.length - 1;
                $scope.displayed_cards[$scope.displayed_card_index].body = $sce.trustAsHtml($scope.cards[random_index].body);
                $scope.cards.splice(random_index, 1);
            }
        }

        $scope.previousCard = function () {
            $scope.displayed_card_index = Math.max(0, $scope.displayed_card_index - 1);
        }

        $scope.nextCard = function () {
            $scope.displayed_card_index = Math.min($scope.displayed_cards.length - 1, $scope.displayed_card_index + 1);
        }

        /*
         * Comment an idea from inspire me
         * TODO:  add rest api
         */
        $scope.sendIdea = function () {
            var send = new sendIdeaService();
            //var url = $location.protocol()+'://'+$location.host()+':'+$location.port()

            send.subject = $scope.formData.title;
            send.message = $scope.formData.description;

            //TODO : {discussionId} need to be dynamic
            send.$save({discussionId: 3}, function success() {

            }, function error() {

            })
        }

    }]);
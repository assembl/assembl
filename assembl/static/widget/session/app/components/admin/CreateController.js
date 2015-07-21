'use strict';

AdminModule.controller('CreateController', ['$rootScope','$scope', '$stateParams', '$http', 'idea',
    function($rootScope, $scope, $stateParams, $http, idea) {

        $scope.current_step = 1;
        $scope.url_parameter_idea = null; // the URL of the idea given in URL parameter, which will be associated to the widget instance
        $scope.discussion_uri = null; // "local:Discussion/1"
        $scope.idea = null; // idea associated to the widget instance
        $scope.discussion = null;
        $scope.widget_creation_endpoint = null;
        $scope.expert_mode = 0;
        $scope.created_widget_uri = null; // "local:Widget/24"
        $scope.created_widget_endpoint = null; // "/data/Widget/24"

        $scope.idea = idea;
        $scope.discussion_uri = idea.discussion;

        $http({
            method: 'GET',
            url: '/data/'+ idea.discussion.split(':')[1]
        }).success(function (data, status, headers) {

            $scope.widget = data;
            $scope.widget.type = 'CreativitySessionWidget';
            $scope.widget.idea = idea['@id'];

            $scope.discussion = data;
            $scope.widget_creation_endpoint = $scope.discussion.widget_collection_url;
            $scope.current_step = 2;

        });

        $scope.createSessionWidget = function(widget) {
            $scope.master = angular.copy(widget);

            $scope.createWidgetInstance(
                $scope.master.widget_collection_url,
                $scope.master.type,
                $scope.master.idea
            );

        };

        // settings can be null
        $scope.createWidgetInstance = function (endpoint, widget_type, settings) {

            var post_data = {
                "type": widget_type
            };

            if (settings != null) {
                post_data["settings"] = JSON.stringify({"idea": settings});
            }

            console.debug(post_data, endpoint)

            /* @id: "local:Widget/40"
            @type: "CreativitySessionWidget"
            @view: "default"
            confirm_ideas_url: "local:Discussion/1/widgets/40/confirm_ideas"
            confirm_messages_url: "local:Discussion/1/widgets/40/confirm_messages"
            discussion: "local:Discussion/1"
            ideas_hiding_url: "local:Discussion/1/widgets/40/base_idea_hiding/-/children"
            ideas_url: "local:Discussion/1/widgets/40/base_idea/-/children"
            messages_url: "local:Discussion/1/widgets/40/base_idea/-/widgetposts"
            settings:
                Objectstate:
                    Objectuser_state_url: "local:Widget/40/user_state"
            user_states_url: "local:Widget/40/user_states"
            widget_settings_url: "local:Widget/40/settings"
            widget_state_url: "local:Widget/40/state" */

            $http({
                method: 'POST',
                url: endpoint,
                data: $.param(post_data),
                async: true,
                headers: {'Content-Type': 'application/x-www-form-urlencoded'}
                //headers: {'Content-Type': 'application/json'}
            }).success(function (data, status, headers) {

                console.debug('success', data);

                var created_widget = headers("Location"); // "local:Widget/5"

                $scope.created_widget_uri = created_widget;
                $scope.created_widget_endpoint = '/data/'+ $scope.created_widget_uri.split(':')[1];

                $scope.updateOnceWidgetIsCreated();

            }).error(function (status, headers) {

                console.debug("error");

            });
        };

        $scope.updateOnceWidgetIsCreated = function () {
            $scope.current_step = 3;
        };

    }]);
"use strict";

voteApp.controller('adminCreateFromIdeaCtl',
  ['$scope', '$http', '$routeParams', '$log', '$location', 'globalConfig', 'configTestingService', 'configService', 'AssemblToolsService',
  function($scope, $http, $routeParams, $log, $location, globalConfig, configTestingService, configService, AssemblToolsService) {

    $scope.current_step = 1;
    $scope.url_parameter_idea = null; // the URL of the idea given in URL parameter, which will be associated to the widget instance
    $scope.discussion_uri = null; // "local:Discussion/1"
    $scope.idea = null; // idea associated to the widget instance
    $scope.discussion = null;
    $scope.widget_creation_endpoint = null;
    $scope.expert_mode = 0;
    $scope.created_widget_uri = null; // "local:Widget/24"
    $scope.created_widget_endpoint = null; // "/data/Widget/24"

    $scope.init = function() {
    console.log("adminCreateFromIdeaCtl::init()");

    // fill widget creation form
    // TODO: handle error cases (no URL parameter given, server answer is not/bad JSON, etc)

    console.log($routeParams.idea);
    $scope.url_parameter_idea = $routeParams.idea;
    $http({
      method: 'GET',
      url: AssemblToolsService.resourceToUrl($scope.url_parameter_idea)
    }).success(function(data, status, headers) {
      console.log(data);
      $scope.idea = data;
      $scope.discussion_uri = data.discussion;

      $http({
        method: 'GET',
        url: AssemblToolsService.resourceToUrl($scope.discussion_uri)
      }).success(function(data, status, headers) {
        console.log(data);
        $scope.discussion = data;
        $scope.widget_creation_endpoint = $scope.discussion.widget_collection_url;
        $scope.current_step = 2;
      });

    });

    // associate an action to the widget creation form

    $("#widget_create_without_settings").on("submit", function() {
      $scope.createWidgetInstance(
        $("#widget_create_without_settings_api_endpoint").val(),
        $("#widget_create_without_settings_type").val(),
        { 'votable_root_id': $("#widget_create_without_settings_idea").val() }, //null,
        $("#widget_create_without_settings_result")
      );
    });

  };

    // settings can be null
    $scope.createWidgetInstance = function(endpoint, widget_type, settings, result_holder) {

      var post_data = {
      "type": widget_type
    };

      if (settings != null)
      {
        post_data["settings"] = JSON.stringify(settings);
      }

      $http({
      method: 'POST',
      url: endpoint,
      data: $.param(post_data),

      //data: post_data,
      async: true,
      headers: {'Content-Type': 'application/x-www-form-urlencoded'}

      //headers: {'Content-Type': 'application/json'}
    }).success(function(data, status, headers) {
      console.log("success");
      var created_widget = headers("Location"); // "local:Widget/5"
      console.log("created_widget: " + created_widget);
      $scope.created_widget_uri = created_widget;
      $scope.created_widget_endpoint = AssemblToolsService.resourceToUrl($scope.created_widget_uri);
      result_holder.text("Success! Location: " + created_widget);
      $scope.updateOnceWidgetIsCreated();
    }).error(function(status, headers) {
      console.log("error");
      result_holder.text("Error");
    });
    };

    $scope.updateOnceWidgetIsCreated = function() {
    $scope.current_step = 3;
  };

  }]);

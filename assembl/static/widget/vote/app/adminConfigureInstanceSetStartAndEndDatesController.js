"use strict";

voteApp.controller('adminConfigureInstanceSetStartAndEndDatesCtl',
  ['$scope', '$http', '$routeParams', '$log', '$location', 'globalConfig', 'configTestingService', 'configService', 'AssemblToolsService', 'VoteWidgetService', 
  function($scope, $http, $routeParams, $log, $location, globalConfig, configTestingService, configService, AssemblToolsService, VoteWidgetService) {

    $scope.current_step = 1;
    $scope.current_substep = 1;

    $scope.widget_uri = null; // "local:Widget/24"
    $scope.widget_endpoint = null; // "/data/Widget/24"
    $scope.target = null;
    $scope.widget = null;
    $scope.discussion_uri = null; // "local:Discussion/1"
    $scope.ideas = null; // list of all ideas of the discussion
    $scope.votable_ideas_url = null; // "local:Discussion/4/widgets/5/targets/"
    $scope.votable_ideas_endpoint = null; // "/data/Discussion/4/widgets/5/targets/"
    $scope.votable_ideas = null; // array of ideas (their full structure)

    $scope.init = function() {
      console.log("adminConfigureInstanceSetStartAndEndDatesCtl::init()");

      $scope.widget_uri = $routeParams.widget_uri;
      console.log($scope.widget_uri);

      // get widget information from its endpoint

      $scope.widget_endpoint = AssemblToolsService.resourceToUrl($scope.widget_uri);

      $http({
        method: 'GET',
        url: $scope.widget_endpoint
      }).success(function(data, status, headers) {
        console.log(data);
        $scope.widget = data;
        $scope.updateOnceWidgetIsReceived();
      });
    };

    $scope.updateOnceWidgetIsReceived = function(){
      $scope.formData = {
        "start_date": null,
        "end_date": null,
      };
      var widget = $scope.widget;
      if ( "start_date" in widget ){
        $scope.formData.startDate = widget.start_date;
      }
      if ( "end_date" in widget ){
        $scope.formData.endDate = widget.end_date;
      }
      $scope.current_step = 2;
    };

    $scope.saveWidgetSettings = function() {

      var dates = {"start_date": null,"end_date": null},
          startDate = $scope.formData.startDate,
          endDate = $scope.formData.endDate;
      if (startDate) {
        if (startDate instanceof Date) {
          startDate = startDate.toISOString();
        }
        dates.start_date = startDate;
      }
      if ($scope.formData.endDate) {
        if (endDate instanceof Date) {
          endDate = endDate.toISOString();
        }
        dates.end_date = endDate;
      }
      
      $http({
        url: AssemblToolsService.resourceToUrl($scope.widget["@id"]),
        method: "PATCH",
        data: dates,
        headers: {
          "Content-Type": "application/json"
        }
      }).success(function(data, status) {
        $("#widget_set_start_and_end_dates_result").text("Configuration has been successfully saved!");
      }).error(function(data, status) {
        $("#widget_set_start_and_end_dates_result").text("Error while saving configuration");
      });
    };

  }]);

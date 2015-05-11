"use strict";

voteApp.controller('adminConfigureInstanceSetCriteriaCtl',
  ['$scope', '$http', '$routeParams', '$log', '$location', 'globalConfig', 'configTestingService', 'configService', 'Discussion', 'AssemblToolsService', 'VoteWidgetService', 
  function($scope, $http, $routeParams, $log, $location, globalConfig, configTestingService, configService, Discussion, AssemblToolsService, VoteWidgetService){

  $scope.current_step = 1;
  $scope.current_substep = 1;

  $scope.widget_uri = null; // "local:Widget/24"
  $scope.widget_endpoint = null; // "/data/Widget/24"
  $scope.target = null;
  $scope.widget = null;
  $scope.discussion_uri = null; // "local:Discussion/1"
  $scope.ideas = null; // list of all ideas of the discussion
  $scope.criteria_url = null; // "local:Discussion/1/widgets/66/criteria"
  $scope.criteria_endpoint = null; // "/data/Discussion/1/widgets/66/criteria"
  $scope.criteria = null; // array of ideas (their full structure)

  $scope.init = function(){
    console.log("adminConfigureInstanceSetCriteriaCtl::init()");

    $scope.widget_uri = $routeParams.widget_uri;
    console.log($scope.widget_uri);

    if ( !$scope.widget_uri )
    {
      alert("Please provide a 'widget_uri' URL parameter.");
      $location.path( "/admin" );
    }

    $scope.target = $routeParams.target;


    // get widget information from its endpoint

    $scope.widget_endpoint = AssemblToolsService.resourceToUrl($scope.widget_uri);

    $http({
      method: 'GET',
      url: $scope.widget_endpoint
    }).success(function(data, status, headers){
      console.log(data);
      $scope.widget = data;
      $scope.updateOnceWidgetIsReceived();
    });


    // associate actions to forms

    $("#widget_set_criteria").on("submit", function(){
      $scope.associateCriteria(
        $scope.criteria,
        $("#widget_select_criteria_result")
      );
    });
  };

  $scope.updateOnceWidgetIsReceived = function(){
    $scope.discussion_uri = $scope.widget.discussion;
    $scope.criteria_url = $scope.widget.criteria_url;
    $scope.criteria_endpoint = AssemblToolsService.resourceToUrl($scope.criteria_url);
    $scope.criteria = $scope.widget.criteria;
    console.log("$scope.criteria:");
    console.log($scope.criteria);

    $scope.current_step = 2;
    $scope.current_substep = 1;


    // get the list of ideas in this discussion

    var ideas_endpoint_url = AssemblToolsService.resourceToUrl($scope.discussion_uri) + '/ideas?view=default';
    $http({
      method: 'GET',
      url: ideas_endpoint_url
    }).success(function(data, status, headers){
      console.log(data);
      $scope.current_substep = 2;
      $scope.ideas = data;
    });
  };

  $scope.associateCriteria = function(criteria, result_holder){
    var post_data = criteria; // maybe we should send only an array of @id fields instead of the whole ideas
    var endpoint = $scope.criteria_endpoint;
    VoteWidgetService.putJson(endpoint, post_data, result_holder);
  };
}]);
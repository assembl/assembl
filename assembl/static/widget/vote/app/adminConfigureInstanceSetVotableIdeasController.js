"use strict";

voteApp.controller('adminConfigureInstanceSetVotableIdeasCtl',
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
  $scope.votable_ideas_url = null; // "local:Discussion/4/widgets/5/targets/"
  $scope.votable_ideas_endpoint = null; // "/data/Discussion/4/widgets/5/targets/"
  $scope.votable_ideas = null; // array of ideas (their full structure)

  $scope.init = function(){
    console.log("adminConfigureInstanceSetVotableIdeasCtl::init()");

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
      url: $scope.widget_endpoint,
    }).success(function(data, status, headers){
      console.log(data);
      $scope.widget = data;
      $scope.updateOnceWidgetIsReceived();
    });


    // associate actions to forms

    $("#widget_set_votable_ideas").on("submit", function(){
      $scope.associateVotableIdeas(
        $scope.votable_ideas,
        $("#widget_set_votable_ideas_result")
      );
    });
  };

  $scope.updateOnceWidgetIsReceived = function(){
    $scope.discussion_uri = $scope.widget.discussion;
    $scope.votable_ideas_url = $scope.widget.votables_url;
    

    //console.log("$scope.widget.votable_ideas_url: ", $scope.widget.votable_ideas_url);
    console.log("$scope.widget.votables_url: ", $scope.widget.votables_url);
    console.log("$scope.widget: ", $scope.widget);
    $scope.votable_ideas_endpoint = AssemblToolsService.resourceToUrl($scope.votable_ideas_url);
    console.log("$scope.votable_ideas_endpoint: ", $scope.votable_ideas_endpoint);
    $scope.votable_ideas = $scope.widget.votable_ideas; // should we transform this data? we do not get the shortTitles
    console.log("$scope.votable_ideas:");
    console.log($scope.votable_ideas);

    $scope.current_step = 2;
    $scope.current_substep = 1;


    // get the list of ideas in this discussion

    var ideas_endpoint_url = AssemblToolsService.resourceToUrl($scope.discussion_uri) + '/ideas?view=default';
    $http({
      method: 'GET',
      url: ideas_endpoint_url,
    }).success(function(data, status, headers){
      console.log(data);
      $scope.current_substep = 2;
      $scope.ideas = data;
    });
  };

  $scope.associateVotableIdeas = function(ideas, result_holder){
    console.log("associateVotableIdeas()");
    var post_data = ideas; // maybe we should send only an array of @id fields instead of the whole ideas
    var endpoint = $scope.votable_ideas_endpoint;
    VoteWidgetService.putJson(endpoint, post_data, result_holder);
  };
}]);
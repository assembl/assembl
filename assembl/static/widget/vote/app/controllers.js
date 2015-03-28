"use strict";

voteApp.controller('adminConfigureInstanceCtl',
  ['$scope', '$http', '$routeParams', '$log', '$location', 'globalConfig', 'configTestingService', 'configService', 'Discussion', 'AssemblToolsService', 'VoteWidgetService', 
  function($scope, $http, $routeParams, $log, $location, globalConfig, configTestingService, configService, Discussion, AssemblToolsService, VoteWidgetService){

  $scope.current_step = 1;
  $scope.current_substep = 1;

  $scope.widget_uri = null; // "local:Widget/24"
  $scope.widget_endpoint = null; // "/data/Widget/24"
  $scope.target = null;

  $scope.init = function(){
    console.log("adminConfigureInstanceCtl::init()");

    $scope.widget_uri = $routeParams.widget_uri;
    console.log($scope.widget_uri);

    if ( !$scope.widget_uri )
    {
      alert("Please provide a 'widget_uri' URL parameter.");
      $location.path( "/admin" );
    }

    $scope.target = $routeParams.target;

    $scope.widget_endpoint = AssemblToolsService.resourceToUrl($scope.widget_uri);
  };

  $scope.deleteThisWidget = function (){
      var approve = confirm("Do you confirm that you want to delete this widget instance?"); // TODO: i18n
      if ( approve )
      {
          $scope.deleteWidget($scope.widget_endpoint, $("#widget_delete_result"));
      }
  };

  $scope.deleteWidget = function(endpoint, result_holder){
      $http({
          method: 'DELETE',
          url: endpoint,
          headers: {'Content-Type': 'application/x-www-form-urlencoded'}
      }).success(function(data, status, headers){
          console.log("success");
          result_holder.text("Success!");
          alert("The widget has been successfully deleted!"); // TODO: i18n
          window.parent.exitModal();
      }).error(function(status, headers){
          console.log("error");
          result_holder.text("Error");
      });
  };
}]);


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
  $scope.votable_ideas_url = null; // "local:Discussion/1/widgets/66/criteria"
  $scope.votable_ideas_endpoint = null; // "/data/Discussion/1/widgets/66/criteria"
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
    

    console.log("$scope.widget.votable_ideas_url: ", $scope.widget.votable_ideas_url);
    console.log("$scope.widget: ", $scope.widget);
    $scope.votable_ideas_endpoint = AssemblToolsService.resourceToUrl($scope.votable_ideas_url);
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

voteApp.controller('adminConfigureInstanceSetSettingsItemCtl', ['$scope', 'VoteWidgetService', function($scope, VoteWidgetService){
  $scope.$watch('item.type', function (newValue, oldValue) {
    if ( newValue != oldValue )
    {
      // create the necessary amount of criterion fields, depending on the item type chosen, and the minimum of criterion they require
      if ( newValue == "vertical_gauge" )
      {
        if ( $scope.item.criteria.length < 1 )
        {
          var criterion = {};
          VoteWidgetService.addDefaultFields(criterion, VoteWidgetService.mandatory_criterion_fields);
          $scope.widget.settings.items[$scope.item_index].criteria.push(criterion);
        }
        // here we could also remove the remaining criteria if there are more than 1, or show them in red
      }
      else if ( newValue == "2_axes" )
      {
        while ( $scope.item.criteria.length < 2 )
        {
          var criterion = {};
          VoteWidgetService.addDefaultFields(criterion, VoteWidgetService.mandatory_criterion_fields);
          $scope.widget.settings.items[$scope.item_index].criteria.push(criterion);
        }
        // here we could also remove the remaining criteria if there are more than 2, or show them in red
      }
    }
  });
}]);

voteApp.controller('adminConfigureInstanceSetSettingsItemCriterionCtl', ['$scope', function($scope){
  // pre-fill "name" field: if the user selects a criterion for a voting item (or sets the currently selected criterion to another one), set its "pretty" name to the criterion shortTitle
  $scope.$watch('criterion.entity_id', function (newValue, oldValue) {
    if ( newValue != oldValue ) // && !$scope.criterion.name
    {
      var criterionWithDetails = _.find($scope.criteria, function(criterion){
        return criterion["@id"] == newValue;
      });
      if ( criterionWithDetails && criterionWithDetails.shortTitle )
        $scope.criterion.name = criterionWithDetails.shortTitle;
    }
  });
}]);


voteApp.controller('adminConfigureInstanceSetSettingsCtl',
  ['$scope', '$http', '$routeParams', '$log', '$location', 'globalConfig', 'configTestingService', 'configService', 'Discussion', 'AssemblToolsService', 'VoteWidgetService', 
  function($scope, $http, $routeParams, $log, $location, globalConfig, configTestingService, configService, Discussion, AssemblToolsService, VoteWidgetService){

  $scope.current_step = 1;
  $scope.current_substep = 1;

  $scope.widget_uri = null; // "local:Widget/24"
  $scope.widget_endpoint = null; // "/data/Widget/24"
  $scope.widget = null;
  $scope.discussion_uri = null; // "local:Discussion/1"
  $scope.criteria_url = null; // "local:Discussion/1/widgets/66/criteria"
  $scope.criteria_endpoint = null; // "/data/Discussion/1/widgets/66/criteria"
  $scope.criteria = null; // array of ideas (their full structure)


  $scope.mandatory_settings_fields = VoteWidgetService.mandatory_settings_fields;
  $scope.optional_settings_fields = VoteWidgetService.optional_settings_fields;
  $scope.mandatory_item_fields = VoteWidgetService.mandatory_item_fields;
  $scope.optional_item_fields = VoteWidgetService.optional_item_fields;
  $scope.mandatory_criterion_fields = VoteWidgetService.mandatory_criterion_fields;
  $scope.optional_criterion_fields = VoteWidgetService.optional_criterion_fields;


  $scope.criterion_current_selected_field = null;
  $scope.settings_current_selected_field = null;
  $scope.item_current_selected_field = null;

  $scope.init = function(){
    console.log("adminConfigureFromIdeaCtl::init()");
    $scope.widget_uri = $routeParams.widget_uri;
    console.log($scope.widget_uri);


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

  };

  $scope.addItem = function(){
    var item = {
      'criteria': []
    };
    VoteWidgetService.addDefaultFields(item, $scope.mandatory_item_fields);
    $scope.widget.settings.items.push(item);
  };

  $scope.addCriterion = function(item_index){
    var criterion = {};
    VoteWidgetService.addDefaultFields(criterion, $scope.mandatory_criterion_fields);
    $scope.widget.settings.items[item_index].criteria.push(criterion);
  };

  $scope.addCriterionField = function(item_index, criterion_index, field_name){
    $scope.widget.settings.items[item_index].criteria[criterion_index][field_name] = VoteWidgetService.getFieldDefaultValue($scope.optional_criterion_fields, field_name, true);
  };

  $scope.addItemField = function(item_index, field_name){
    $scope.widget.settings.items[item_index][field_name] = VoteWidgetService.getFieldDefaultValue($scope.optional_item_fields, field_name, true);
  };

  $scope.addSettingsField = function(field_name){
    $scope.widget.settings[field_name] = VoteWidgetService.getFieldDefaultValue($scope.optional_settings_fields, field_name, true);
  };

  $scope.deleteCriterionField = function (item_index, criterion_index, field_name){
    delete $scope.widget.settings.items[item_index].criteria[criterion_index][field_name];
  };

  $scope.deleteItemField = function (item_index, field_name){
    delete $scope.widget.settings.items[item_index][field_name];
  };

  $scope.deleteSettingsField = function (field_name){
    delete $scope.widget.settings[field_name];
  };

  $scope.updateOnceWidgetIsReceived = function(){
    if (!$scope.widget.settings || !$scope.widget.settings.items)
        $scope.widget.settings = {"items":[]};
    VoteWidgetService.addDefaultFields($scope.widget.settings, $scope.mandatory_settings_fields);
    console.log("$scope.widget.settings:");
    console.log($scope.widget.settings);

    $scope.discussion_uri = $scope.widget.discussion;
    $scope.criteria_url = $scope.widget.criteria_url;
    $scope.criteria_endpoint = AssemblToolsService.resourceToUrl($scope.criteria_url);
    $scope.criteria = $scope.widget.criteria;
    console.log("$scope.criteria:");
    console.log($scope.criteria);

    $scope.current_step = 2;
  };

  $scope.applyWidgetSettings = function(){
    console.log("applyWidgetSettings()");

    var endpoint = $scope.widget_endpoint + "/settings";
    var post_data = $scope.widget.settings;
    var result_holder = $("#step_criteria_groups_and_appearance_result");
    VoteWidgetService.putJson(endpoint, post_data, result_holder);
  };

}]);

voteApp.controller('adminCreateFromIdeaCtl',
  ['$scope', '$http', '$routeParams', '$log', '$location', 'globalConfig', 'configTestingService', 'configService', 'Discussion', 'AssemblToolsService',
  function($scope, $http, $routeParams, $log, $location, globalConfig, configTestingService, configService, Discussion, AssemblToolsService){

  $scope.current_step = 1;
  $scope.url_parameter_idea = null; // the URL of the idea given in URL parameter, which will be associated to the widget instance
  $scope.discussion_uri = null; // "local:Discussion/1"
  $scope.idea = null; // idea associated to the widget instance
  $scope.discussion = null;
  $scope.widget_creation_endpoint = null;
  $scope.expert_mode = 0;
  $scope.created_widget_uri = null; // "local:Widget/24"
  $scope.created_widget_endpoint = null; // "/data/Widget/24"

  $scope.init = function(){
    console.log("adminCreateFromIdeaCtl::init()");

    // fill widget creation form
    // TODO: handle error cases (no URL parameter given, server answer is not/bad JSON, etc)

    console.log($routeParams.idea);
    $scope.url_parameter_idea = $routeParams.idea;
    $http({
      method: 'GET',
      url: AssemblToolsService.resourceToUrl($scope.url_parameter_idea)
    }).success(function(data, status, headers){
      console.log(data);
      $scope.idea = data;
      $scope.discussion_uri = data.discussion;

      $http({
        method: 'GET',
        url: AssemblToolsService.resourceToUrl($scope.discussion_uri)
      }).success(function(data, status, headers){
        console.log(data);
        $scope.discussion = data;
        $scope.widget_creation_endpoint = $scope.discussion.widget_collection_url;
        $scope.current_step = 2;
      });

    });

    // associate an action to the widget creation form

    $("#widget_create_without_settings").on("submit", function(){
      $scope.createWidgetInstance(
        $("#widget_create_without_settings_api_endpoint").val(),
        $("#widget_create_without_settings_type").val(),
        { 'votable_root_id': $("#widget_create_without_settings_idea").val() }, //null,
        $("#widget_create_without_settings_result")
      );
    });

  };

  // settings can be null
  $scope.createWidgetInstance = function(endpoint, widget_type, settings, result_holder){

    var post_data = {
      "type": widget_type
    };

    if ( settings != null )
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
    }).success(function(data, status, headers){
      console.log("success");
      var created_widget = headers("Location"); // "local:Widget/5"
      console.log("created_widget: " + created_widget);
      $scope.created_widget_uri = created_widget;
      $scope.created_widget_endpoint = AssemblToolsService.resourceToUrl($scope.created_widget_uri);
      result_holder.text("Success! Location: " + created_widget);
      $scope.updateOnceWidgetIsCreated();
    }).error(function(status, headers){
      console.log("error");
      result_holder.text("Error");
    });
  };

  $scope.updateOnceWidgetIsCreated = function(){
    $scope.current_step = 3;
  };


}]);

voteApp.controller('adminCtl',
  ['$scope', '$http', '$routeParams', '$log', '$location', 'globalConfig', 'configTestingService', 'configService', 'Discussion', 'AssemblToolsService', 'VoteWidgetService',
  function($scope, $http, $routeParams, $log, $location, globalConfig, configTestingService, configService, Discussion, AssemblToolsService, VoteWidgetService){

  $scope.init = function(){
    console.log("adminCtl::init()");

    $scope.current_step = 1;
    $scope.widget_endpoint = null;
    $scope.widget_data = null; // the content received from the widget endpoint
    $scope.widget_settings_endpoint = null;
    $scope.widget_criteria_endpoint = null;

    $("#widget_create_without_settings").on("submit", function(){
      $scope.createWidgetInstance(
        $("#widget_create_without_settings_api_endpoint").val(),
        $("#widget_create_without_settings_type").val(),
        null,
        $("#widget_create_without_settings_result")
      );
    });

    
    $("#step_set_settings").on("submit", function(){
      $scope.setWidgetSettings(
        $("#set_settings_api_endpoint").val(),
        $("#set_settings_settings").val(),
        $("#set_settings_result")
      );
    });



    $("#widget_create").on("submit", function(){
      $scope.createWidgetInstance(
        $("#widget_create_api_endpoint").val(),
        $("#widget_create_type").val(),
        $("#widget_create_settings").val(),
        $("#widget_create_result")
      );
    });

    $("#criterion_add").on("submit", function(){
      $scope.addCriterion(
        $("#criterion_add_api_endpoint").val(),
        $("#criterion_add_id").val(),
        $("#criterion_add_result")
      );
    });

    $("#idea_children_to_criteria").on("submit", function(){
      $scope.ideaChildrenToCriteria(
        $("#idea_children_to_criteria_endpoint").val(),
        $("#idea_children_to_criteria_result")
      );
    });

    $("#criteria_set").on("submit", function(){
      $scope.setCriteria(
        $("#criteria_set_endpoint").val(),
        $("#criteria_set_criteria").val(),
        $("#criteria_set_result")
      );
    });

    $("#criterion_remove").on("submit", function(){
      $scope.removeCriterion(
        $("#criterion_remove_api_endpoint").val(),
        $("#criterion_remove_id").val(),
        $("#criterion_remove_result")
      );
    });

    $("#widget_delete").on("submit", function(){
      $scope.deleteWidget(
        $("#widget_delete_widget_endpoint").val(),
        $("#widget_delete_result")
      );
    });
    
    
    
  };

  $scope.ideaChildrenToCriteria = function(endpoint, result_holder){
    $http({
      method: 'GET',
      url: endpoint
    }).success(function(data, status, headers){
      console.log("success");
      console.log("data:");
      console.log(data);
      var criteria = data;
      var criteria_output = [];
      if ( criteria && criteria.length && criteria.length > 0 )
      {
        for ( var i = 0; i < criteria.length; ++i )
        {
          //criteria_output.push({ "@id": criteria[i], "short_title": "criterion "+i });
          criteria_output.push({ "@id": criteria[i] });
        }
        result_holder.append("Success! Transformed data follows:<br/><textarea>"+JSON.stringify(criteria_output)+"</textarea>");
      }
      else
      {
        console.log("error while parsing the result of the API call");
      }
    }).error(function(status, headers){
      console.log("error");
    });
  };

  $scope.updateOnceWidgetIsCreated = function(){
    $http({
      method: 'GET',
      url: $scope.widget_endpoint
      //data: $.param(post_data),
      //headers: {'Content-Type': 'application/json'}
      //headers: {'Content-Type': 'application/x-www-form-urlencoded'}
    }).success(function(data, status, headers){
      console.log("success");
      $scope.widget_data = data;
      if ( !data.widget_settings_url )
      {
        console.log("error: widget data does not contain a widget_settings_url property");
        return;
      }
      $scope.widget_settings_endpoint = AssemblToolsService.resourceToUrl(data.widget_settings_url);
      $("#set_settings_api_endpoint").val($scope.widget_settings_endpoint);

      $("#criterion_add_api_endpoint").val($scope.widget_criteria_endpoint);
      $scope.widget_criteria_endpoint = AssemblToolsService.resourceToUrl(data.criteria_url);

      ++$scope.current_step;
    }).error(function(status, headers){
      console.log("error");
    });
  };

  // settings can be null
  $scope.createWidgetInstance = function(endpoint, widget_type, settings, result_holder){

    var post_data = {
      "type": widget_type
    };

    if ( settings != null )
    {
      post_data["settings"] = settings;
    }

    $http({
        method: 'POST',
        url: endpoint,
        data: $.param(post_data),
        async: true,
        //headers: {'Content-Type': 'application/json'}
        headers: {'Content-Type': 'application/x-www-form-urlencoded'}
    }).success(function(data, status, headers){
        console.log("success");
        var created_widget = headers("Location"); // "local:Widget/5"
        console.log("created_widget: " + created_widget);
        $scope.widget_endpoint = AssemblToolsService.resourceToUrl(created_widget);
        result_holder.text("Success! Location: " + created_widget);
        $scope.updateOnceWidgetIsCreated();
    }).error(function(status, headers){
        console.log("error");
        result_holder.text("Error");
    });
  };

  $scope.setWidgetSettings = function(endpoint, settings, result_holder){
    console.log("setWidgetSettings()");

    var post_data = settings;
    VoteWidgetService.putJson(endpoint, post_data, result_holder);
  };

  $scope.addCriterion = function(endpoint, criterion_id, result_holder){
    var post_data = {
      "id": criterion_id
    };

    $http({
        method: 'POST',
        url: endpoint,
        data: $.param(post_data),
        async: true,
        headers: {'Content-Type': 'application/x-www-form-urlencoded'}
    }).success(function(data, status, headers){
        console.log("success");
        result_holder.text("Success!");
    }).error(function(status, headers){
        console.log("error");
        result_holder.text("Error");
    });
  };

  $scope.removeCriterion = function(endpoint, criterion_id, result_holder){
    var criterion_id_last_part = criterion_id.substr(criterion_id.lastIndexOf("/")+1);

    $http({
        method: 'DELETE',
        url: endpoint+"/"+criterion_id_last_part,
        //data: $.param(post_data),
        headers: {'Content-Type': 'application/x-www-form-urlencoded'}
    }).success(function(data, status, headers){
        console.log("success");
        result_holder.text("Success!");
    }).error(function(status, headers){
        console.log("error");
        result_holder.text("Error");
    });
  };

  $scope.setCriteria = function(endpoint, criteria, result_holder){
    var post_data = criteria;
    VoteWidgetService.putJson(endpoint, post_data, result_holder);
  };

  $scope.deleteWidget = function(endpoint, result_holder){
    $http({
        method: 'DELETE',
        url: endpoint,
        headers: {'Content-Type': 'application/x-www-form-urlencoded'}
    }).success(function(data, status, headers){
        console.log("success");
        result_holder.text("Success!");
    }).error(function(status, headers){
        console.log("error");
        result_holder.text("Error");
    });
  };

}]);


voteApp.controller('votedCtl',
  ['$scope', '$http', '$routeParams', '$log', '$location', 'globalConfig', 'configTestingService', 'configService', 'Discussion',
  function($scope, $http, $routeParams, $log, $location, globalConfig, configTestingService, configService, Discussion){

  $scope.init = function(){
    console.log("votedCtl::init()");

    $scope.settings = configService.settings;
    console.log("settings:");
    console.log($scope.settings);
  }

}]);

voteApp.controller('resultsCtl',
  ['$scope', '$http', '$routeParams', '$log', '$location', 'globalConfig', 'configTestingService', 'configService', 'Discussion', 'AssemblToolsService', 'VoteWidgetService',
  function($scope, $http, $routeParams, $log, $location, globalConfig, configTestingService, configService, Discussion, AssemblToolsService, VoteWidgetService){

    // intialization code (constructor)

    $scope.init = function(){
      console.log("resultsCtl::init()");

      console.log("configService:");
      console.log(configService);
      $scope.settings = configService.settings;
      console.log("settings 0:");
      console.log($scope.settings);


      // check that the user is logged in
      if ( !configService.user || !configService.user.verified )
      {
        alert('You have to be authenticated to vote. Please log in and try again.');
        window.location.assign("/login");
        return;
      }
      $scope.user = configService.user;
      

      // TODO (when the API is implemented): check that the user has the right to participate in this vote

      $scope.vote_results_uri = configService.vote_results_url;
      $scope.vote_count_uri = configService.vote_count_url;

      $scope.vote_results_endpoint = AssemblToolsService.resourceToUrl($scope.vote_results_uri);
      $scope.vote_count_endpoint = AssemblToolsService.resourceToUrl($scope.vote_count_uri);

    };

}]);

voteApp.controller('indexCtl',
  ['$scope', '$http', '$routeParams', '$log', '$location', '$translate', 'globalConfig', 'configTestingService', 'configService', 'Discussion', 'AssemblToolsService', 'VoteWidgetService',
  function($scope, $http, $routeParams, $log, $location, $translate, globalConfig, configTestingService, configService, Discussion, AssemblToolsService, VoteWidgetService){

    // intialization code (constructor)

    $scope.init = function(){
      console.log("indexCtl::init()");

      console.log("configService:");
      console.log(configService);
      $scope.settings = configService.settings;
      console.log("settings 0:");
      console.log($scope.settings);

      VoteWidgetService.addDefaultFields($scope.settings, VoteWidgetService.mandatory_settings_fields);
      VoteWidgetService.addDefaultFields($scope.settings, VoteWidgetService.optional_settings_fields);

      console.log("settings 1:");
      console.log($scope.settings);

      if ( $scope.settings.items && $scope.settings.items.length )
      {
        _.each($scope.settings.items, function(el){
          VoteWidgetService.addDefaultFields(el, VoteWidgetService.mandatory_item_fields);
          VoteWidgetService.addDefaultFields(el, VoteWidgetService.optional_item_fields);
          if ( el.criteria && el.criteria.length ){
            _.each(el.criteria, function(el2){
              VoteWidgetService.addDefaultFields(el2, VoteWidgetService.mandatory_criterion_fields);
              VoteWidgetService.addDefaultFields(el2, VoteWidgetService.optional_criterion_fields);
            });
          }
        });
      }

      console.log("settings 2:");
      console.log($scope.settings);


      // check that the user is logged in
      if ( !configService.user || !configService.user.verified )
      {
        alert('You have to be authenticated to vote. Please log in and try again.');
        window.location.assign("/login");
        return;
      }
      $scope.user = configService.user;
      

      // TODO (when the API is implemented): check that the user has the right to participate in this vote


      // try to get previous vote of the user

      if ( !configService.user_votes_url )
      {
        $scope.drawUI();
      }
      else
      {
        var my_votes_endpoint_url = AssemblToolsService.resourceToUrl(configService.user_votes_url);
        $http({
          method: 'GET',
          url: my_votes_endpoint_url,
        }).success(function(data, status, headers){
          console.log(data);
          var my_votes = data;
          // override default value of given criteria
          _.each($scope.settings.items, function(item, item_index){
            _.each(item.criteria, function(criterion, criterion_index){
              var entity_id = criterion.entity_id;
              var my_vote_for_this_criterion = _.findWhere(my_votes, {"criterion": entity_id});
              if ( my_vote_for_this_criterion )
              {
                console.log("value found: " + my_vote_for_this_criterion.vote_value);
                var new_value = criterion.valueMin + my_vote_for_this_criterion.vote_value * (criterion.valueMax - criterion.valueMin);
                $scope.settings.items[item_index].criteria[criterion_index].valueDefault = new_value;
                console.log("value set: " + new_value);
              }
            });
          });
          console.log("settings after my votes:");
          console.log($scope.settings);
          $scope.drawUI();
        }).error(function(status, headers){
          console.log("error");
          $scope.drawUI();
        });
      }

      
    };

    $scope.drawUI = function(){
      // set a background color

      if ( $scope.settings.background )
      {
        $("body").css("background", $scope.settings.background);
      }

      // set min width and min height
      
      if ( $scope.settings.minWidth )
      {
        $("body").css("min-width", $scope.settings.minWidth + "px");
      }
      if ( $scope.settings.minHeight )
      {
        $("body").css("min-height", $scope.settings.minHeight + "px");
      }

      // display the UI in a table of classic way depending on the settings

      if ( $scope.settings.displayStyle && $scope.settings.displayStyle == "table" )
      {
        $scope.drawUIWithTable();
      }
      else
      {
        $scope.drawUIWithoutTable();
      }
      if ( window.parent && window.parent.resizeIframe )
        window.parent.resizeIframe();
    };

    $scope.computeMyVotes = function(){
      // do not use .data("criterion-value") because jQuery does not seem to read the value set by d3

      $scope.myVotes = {};
      // once serialized by $.param(), this will give "rentabilite=10&risque=0&investissement=22222&difficulte_mise_en_oeuvre=50"
      $("#d3_container g.criterion").each(function(index) {
        //console.log("current criterion:", $(this).attr("data-criterion-id"));
        var valueMin = parseFloat($(this).attr("data-criterion-value-min"));
        var valueMax = parseFloat($(this).attr("data-criterion-value-max"));
        var value = parseFloat($(this).attr("data-criterion-value"));
        var valueToPost = (value - valueMin) / (valueMax - valueMin); // the posted value has to be a float in [0;1]
        $scope.myVotes[$(this).attr("data-criterion-id")] = valueToPost;
      });

      return $scope.myVotes;
    };

    $scope.submitVote = function(){
      console.log("submitVote()");
      $scope.computeMyVotes();
      console.log("myVotes:");
      console.log($scope.myVotes);

      var vote_result_holder = $("#vote_submit_result_holder");
      vote_result_holder.empty();

      var voting_urls = configService.voting_urls;
      var counter = 0;
      for ( var k in $scope.myVotes )
      {
        if ( $scope.myVotes.hasOwnProperty(k) )
        {
          var vote_value = null; // must be float, and contained in the range defined in the criterion
          if ( typeof $scope.myVotes[k] === 'string' )
            vote_value = parseFloat($scope.myVotes[k]);
          else
            vote_value = $scope.myVotes[k];

          if ( voting_urls[k] )
          {
            var url = AssemblToolsService.resourceToUrl(voting_urls[k]);
            var data_to_post = {
              "type": "LickertIdeaVote",
              "value": vote_value
            };

            var successForK = function(vk){
              return function(data, status, headers){
                console.log("success");
                //alert("success");
                console.log("data:");
                console.log(data);
                console.log("status:");
                console.log(status);
                console.log("headers:");
                console.log(headers);
                //$location.path( "/voted" );

                console.log("k: " + vk);
                var criterion_tag = $("svg g[data-criterion-id=\"" + vk + "\"]");
                var svg = criterion_tag.parent("svg");
                var criterion_name = criterion_tag.attr("data-criterion-name");

                /*
                //svg.css("background","#00ff00").fadeOut();
                svg.css("background","#00ff00");//.delay(1000).css("background","none");
                setTimeout(function(){svg.css("background","none");}, 1000);
                */

                $translate('voteSubmitSuccessForCriterion', {'criterion': criterion_name}).then(function (translation) {
                  vote_result_holder.append($("<p class='success'>" + translation + "</p>"));
                });
              };          
            };

            var errorForK = function(vk){
              return function(status, headers){
                console.log("error");
                //alert("error");
                console.log("status:");
                console.log(status);
                console.log("headers:");
                console.log(headers);
                //$location.path( "/voted" );
                console.log("k: " + vk);
                var criterion_tag = $("svg g[data-criterion-id=\"" + vk + "\"]");
                var svg = criterion_tag.parent("svg");
                var criterion_name = criterion_tag.attr("data-criterion-name");

                svg.css("background","#ff0000");
                setTimeout(function(){svg.css("background","none");}, 1000);

                $translate('voteSubmitFailureForCriterion', {'criterion': criterion_name}).then(function (translation) {
                  vote_result_holder.append($("<p class='failure'>" + translation + "</p>"));
                });
              }
            };

            // we will send votes for each criterion separated with a small delay, so that we avoid server saturation
            // TODO: instead we could chain calls (send a call once the response of the previous one has been received)

            var sendVote = function(url, data_to_post, k, delay){
              setTimeout(function(){
                // POST to this URL
                $http({
                  method: "POST",
                  url: url,
                  data: $.param(data_to_post),
                  //data: data_to_post,
                  headers: {'Content-Type': 'application/x-www-form-urlencoded'}
                  //headers: {'Content-Type': 'application/json'}
                }).success(successForK(k)).error(errorForK(k));
              }, delay);
            };
              
            sendVote(url, data_to_post, k, (counter++)*300);
            
          }
          else
          {
            var error = "Error: No voting_urls endpoint associated to criterion " + k;
            console.error(error);
            alert(error);
            // what else should we do?
          }
        }
      }

    };

    $scope.submitSingleVote = function(endpoint, type, criterion_id){
      console.log("submitSingleVote() parameters:" + endpoint + " " + type + " " + criterion_id);
      var criterion_value = $("#d3_container g.criterion[data-criterion-id=\""+criterion_id+"\"]").attr("data-criterion-value");
      console.log("criterion value:");
      console.log(criterion_value);
    };

    // @param destination
    // The d3 container (div)
    // @param item_data
    // One of the elements of the "items" array, from the configuration JSON
    // @param xPosCenter
    // Position on the X coordinates of the center of the gauge, in the created SVG
    $scope.drawVerticalGauge = function(destination, item_data, xPosCenter){
      console.log("drawVerticalGauge()");
      //console.log("item_data:");
      //console.log(item_data);
      var config = $scope.settings;
      var criterion = item_data.criteria[0];
      var criterionValue = (criterion.valueDefault || criterion.valueDefault === 0.0) ? criterion.valueDefault : criterion.valueMin;
      xPosCenter = xPosCenter ? xPosCenter : item_data.width / 2;

      // create the graph, as a SVG in the d3 container div
      var svg = destination
        .append("svg")
        .attr("width", item_data.width)    
        .attr("height", item_data.height);


      svg.append("g")
        .attr("class", "criterion")
        .attr("data-criterion-name", criterion.name)
        .attr("data-criterion-id", criterion["entity_id"]) // contains something like "local:Idea/3"
        .attr("data-criterion-value", criterionValue)
        .attr("data-criterion-value-min", criterion.valueMin)
        .attr("data-criterion-value-max", criterion.valueMax)
      ;


      // create vertical scale
      var scale = d3.scale.linear()
        .domain([criterion.valueMin, criterion.valueMax])
        .range([item_data.height - config.padding, config.padding])
        .clamp(true);

      var ticks = 5;
      if ( criterion.ticks )
        ticks = criterion.ticks;
      var axis = d3.svg.axis()
        .scale(scale)
        .orient("left")
        .ticks(ticks);

      function setCirclePositionFromOutputRange(y)
      {
        var v = scale.invert(y);

        svg.select("g.criterion").attr("data-criterion-value", v);

        svg.select("circle").attr("cy", scale(v));
      }


      function dragmove(d) {
        //var x = d3.event.x;
        var y = d3.event.y;

        setCirclePositionFromOutputRange(y);
      }

      // define drag beavior
      var drag = d3.behavior.drag()
        .on("drag", dragmove);


      function click()
      {
        // Ignore the click event if it was suppressed
        if (d3.event.defaultPrevented) return;

        // Extract the click location
        var point = d3.mouse(this);
        var p = {x: point[0], y: point[1] };

        setCirclePositionFromOutputRange(p.y);
      }

      svg
        .on("click", click)
        .call(drag);


      // show vertical axis, its label, and its gradient
      if ( criterion.colorMin && criterion.colorMax )
      {
        // define a gradient in the SVG (using a "linearGradient" tag inside the "defs" tag). 0% = top; 100% = bottom
        var defs = svg.append("defs");
        var lg = defs.append("linearGradient")
          .attr("id","gradient_"+criterion.id)
          .attr("x1","0%")
          .attr("y1","0%")
          .attr("x2","0%")
          .attr("y2","100%");
        lg.append("stop")
          .attr("offset","0%")
          .style("stop-color",criterion.colorMax)
          .style("stop-opacity","1");
        if ( criterion.colorAverage )
        {
          lg.append("stop")
            .attr("offset","50%")
            .style("stop-color",criterion.colorAverage)
            .style("stop-opacity","1");
        }
        lg.append("stop")
          .attr("offset","100%")
          .style("stop-color",criterion.colorMin)
          .style("stop-opacity","1");
      }



      var g = svg.append("g");
      
      // show color gradient if set
      var axisBonusClasses = "";
      if ( criterion.colorMin && criterion.colorMax )
      {
        axisBonusClasses = "gradient";
        var gradientWidth = 10;
        g.append("rect")
          .attr("x", xPosCenter -gradientWidth/2 )
          .attr("y", config.padding-1 ) // this is the same as .attr("y", scale(criterion.valueMax) )
          .attr("width",gradientWidth)
          .attr("height",scale(criterion.valueMin) - config.padding +1)
          .attr("fill","url(#gradient_"+criterion.id+")");
      }

      // show vertical axis
      g.append("g")
        .attr("class", "axis "+axisBonusClasses)
        .attr("transform", "translate(" + xPosCenter + ",0)")
        .call(axis);

      // if there is a gradient, edit the axis (which we just created) to show ticks differently
      if ( criterion.colorMin && criterion.colorMax )
      {
        g.selectAll("line")
          .attr("x1","-2")
          .attr("x2","2");
      }

      // show axis label
      var axisLabel = g.append("text")
        .attr("y", item_data.height - config.padding*0.3 )
        .attr("x", xPosCenter )
        .attr("class", "axis-label")
        .text(criterion.name);

      // make the axis label interactive (mouse hover) to show the description text of the criterion
      // possibility of improvement: maybe instead of an HTML "title" attribute, we could use tipsy, as on http://bl.ocks.org/ilyabo/1373263
      if ( !config.showCriterionDescription || config.showCriterionDescription == "tooltip" )
      {
        if ( criterion.description && criterion.description.length > 0 )
        {
          var f = function(){
            // prevent the other click() function to get called
            d3.event.stopPropagation();
            
            // do nothing, so that we just block the other click function in case the user clicks on the axis label because they think it would give more info (info appears on hover after a bit of time, because for now it is handled by the "title" property, so the browser decides how/when it appears)
          }
          axisLabel
            .style("cursor","help")
            .attr("title", criterion.description)
            .on("click", f)
          ;
        }
      }
      else if ( config.showCriterionDescription && config.showCriterionDescription == "text" )
      {
        if ( criterion.description && criterion.description.length > 0 )
        {
          // There is no automatic word wrapping in SVG
          // So we create an HTML element
          var elParent = $("#d3_container");
          var elOrigin = $(svg[0]);
          console.log("svg: ", svg);
          var text = document.createTextNode(criterion.description);
          var node = document.createElement("span");
          node.appendChild(text);
          var descriptionWidth = item_data.width;

          $(node).css("position", "absolute");
          $(node).css("width", descriptionWidth + "px");
          $(node).css("top", elOrigin.offset().top + (item_data.height - config.padding*0.25) + "px");
          $(node).css("left", (elOrigin.offset().left + xPosCenter - descriptionWidth/2) + "px");
          $(node).css("text-align", "center");


          elParent.append(node);
        }
      }

      

      // show descriptions of the minimum and maximum values
      if ( criterion.descriptionMin )
      {
        g.append("text")
          .attr("y", item_data.height - config.padding*0.7 )
          .attr("x", xPosCenter )
          .style("text-anchor", "middle")
          .text(criterion.descriptionMin);
      }
      if ( criterion.descriptionMax )
      {
        g.append("text")
          .attr("y", config.padding*0.7 )
          .attr("x", xPosCenter )
          .style("text-anchor", "middle")
          .text(criterion.descriptionMax);
      }

      // draw the cursor
      svg.append("circle")
        .attr("cx", xPosCenter)
        .attr("cy", scale(criterionValue) )
        .attr("r", 8)
        .style("fill", ( criterion.colorCursor ) ? criterion.colorCursor : "blue")
        .style("cursor", "pointer")
      ;


    };

    // @param destination
    // The d3 container (div)
    // @param item_data
    // One of the elements of the "items" array, from the configuration JSON
    // @param xPosCenter
    // Position on the X coordinates of the center of the gauge, in the created SVG
    $scope.draw2AxesVote = function(destination, item_data, xPosCenter){
      console.log("draw2AxesVote()");
      //console.log("item_data:");
      //console.log(item_data);
      var config = $scope.settings;
      var criteria = item_data.criteria;

      if ( criteria.length < 2 )
      {
        console.log("error: need at least 2 criteria");
        return;
      }

      var criterionXValue = (criteria[0].valueDefault || criteria[0].valueDefault === 0.0) ? criteria[0].valueDefault : criteria[0].valueMin;
      var criterionYValue = (criteria[1].valueDefault || criteria[1].valueDefault === 0.0) ? criteria[1].valueDefault : criteria[1].valueMin;
      xPosCenter = xPosCenter ? xPosCenter : item_data.width / 2;

      // create the graph, as a SVG in the d3 container div
      var svg = destination
        .append("svg")
        .attr("width", item_data.width)    
        .attr("height", item_data.height);


      svg.append("g")
        .attr("class", "criterion")
        .attr("data-criterion-name", criteria[0].name)
        .attr("data-criterion-id", criteria[0]["entity_id"]) // contains something like "local:Idea/3"
        .attr("data-criterion-value", criterionXValue)
        .attr("data-criterion-value-min", criteria[0].valueMin)
        .attr("data-criterion-value-max", criteria[0].valueMax)
        .attr("data-criterion-type", "x")
      ;

      svg.append("g")
        .attr("class", "criterion")
        .attr("data-criterion-name", criteria[1].name)
        .attr("data-criterion-id", criteria[1]["entity_id"]) // contains something like "local:Idea/3"
        .attr("data-criterion-value", criterionYValue)
        .attr("data-criterion-value-min", criteria[1].valueMin)
        .attr("data-criterion-value-max", criteria[1].valueMax)
        .attr("data-criterion-type", "y")
      ;


      // create X and Y scales
      var xScale = d3.scale.linear()
        .domain([criteria[0].valueMin, criteria[0].valueMax])
        .range([config.padding, item_data.width - config.padding])
        .clamp(true);

      var yScale = d3.scale.linear()
        .domain([criteria[1].valueMin, criteria[1].valueMax])
        .range([item_data.height - config.padding, config.padding])
        .clamp(true);


      // create X and Y axes using their scales
      var xTicks = 5;
      if ( criteria[0].ticks )
        xTicks = criteria[1].ticks;
      var xAxis = d3.svg.axis()
        .scale(xScale)
        .orient("bottom")
        .ticks(xTicks);

      var yTicks = 5;
      if ( criteria[1].ticks )
        yTicks = criteria[1].ticks;
      var yAxis = d3.svg.axis()
        .scale(yScale)
        .orient("left")
        .ticks(yTicks);


      function setCirclePositionFromOutputRange(x, y, setData)
      {
        var xValue = xScale.invert(x);
        var yValue = yScale.invert(y);

        if ( setData === true )
        {
          svg.select("g.criterion[data-criterion-type='x']").attr("data-criterion-value", xValue);
          svg.select("g.criterion[data-criterion-type='y']").attr("data-criterion-value", yValue);
        }

        svg.selectAll("circle").attr("cx", xScale(xValue));
        svg.selectAll("circle").attr("cy", yScale(yValue));
      }


      function dragmove(d) {
        var x = d3.event.x;
        var y = d3.event.y;

        setCirclePositionFromOutputRange(x, y);
      }

      function dragEnd(d){
        var x = svg.selectAll("circle").attr("cx");
        var y = svg.selectAll("circle").attr("cy");

        setCirclePositionFromOutputRange(x, y, true);
      }

      // define drag beavior
      var drag = d3.behavior.drag()
        .origin(function(){
          var point = d3.mouse(this);
          var p = {x: point[0], y: point[1] };
          // show cursor on the "pressed" position, without waiting for "release" event
          setCirclePositionFromOutputRange(p.x, p.y);
          return p;
        })
        .on("drag", dragmove)
        .on("dragend", dragEnd);


      function click()
      {
        // Ignore the click event if it was suppressed
        if (d3.event.defaultPrevented) return;

        // Extract the click location
        var point = d3.mouse(this);
        var p = {x: point[0], y: point[1] };

        setCirclePositionFromOutputRange(p.x, p.y);
      }

      svg
        .on("click", click)
        .call(drag);


      var g = svg.append("g");

      // show X axis
      g.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(0," + (item_data.height - config.padding) + ")")
        .call(xAxis);

      // show Y axis
      g.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(" + config.padding + ",0)")
        .call(yAxis);

      // show X axis label
      var xAxisLabel = g.append("text")
        //.attr("transform", "translate(" + (width / 2) + " ," + (height + margin.bottom) + ")")
        .attr("y", (item_data.height - config.padding * 0.45) )
        .attr("x", (item_data.width / 2) )
        .attr("dy", "1em")
        .attr("class", "axis-label")
        .text(criteria[0].name);

      // show Y axis label
      var yAxisLabel = g.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", (0) )
        .attr("x", (0 - item_data.height/2) )
        .attr("dy", config.padding/3 + "px")
        .attr("class", "axis-label")
        .text(criteria[1].name);


      // make the axis labels interactive (mouse hover) to show the description text of the criterion
      if ( !config.showCriterionDescription || config.showCriterionDescription == "tooltip" )
      {
        var onClickDoNothing = function(){
          // prevent the other click() function to get called
          d3.event.stopPropagation();
          
          // do nothing, so that we just block the other click function in case the user clicks on the axis label because they think it would give more info (info appears on hover after a bit of time, because for now it is handled by the "title" property, so the browser decides how/when it appears)
        };
        if ( criteria[0].description && criteria[0].description.length > 0 )
        {
          xAxisLabel
            .style("cursor","help")
            .attr("title", criteria[0].description)
            .on("click", onClickDoNothing)
          ;
        }
        if ( criteria[1].description && criteria[1].description.length > 0 )
        {
          yAxisLabel
            .style("cursor","help")
            .attr("title", criteria[1].description)
            .on("click", onClickDoNothing)
          ;
        }
      }
      else if ( config.showCriterionDescription && config.showCriterionDescription == "text" )
      {
        for ( var i = 0; i < 2; ++i )
        {
          if ( criteria[i].description && criteria[i].description.length > 0 )
          {
            // There is no automatic word wrapping in SVG
            // So we create an HTML element
            var elParent = $("#d3_container");
            var elOrigin = $(svg[0]);
            console.log("svg: ", svg);
            var text = document.createTextNode(criteria[i].description);
            var node = document.createElement("span");
            node.appendChild(text);
            var descriptionWidth = item_data.width;
            if ( i == 1 )
              descriptionWidth = item_data.height;

            $(node).css("position", "absolute");
            $(node).css("width", descriptionWidth + "px");
            $(node).css("top", (elOrigin.offset().top + (item_data.height - config.padding*0.25)) + "px");
            $(node).css("left", (elOrigin.offset().left + xPosCenter - descriptionWidth/2) + "px");
            $(node).css("text-align", "center");

            if ( i == 1 )
            {
              $(node).css("top", (elOrigin.offset().top + (item_data.height/2)) + "px");
              $(node).css("left", (elOrigin.offset().left - descriptionWidth/2) + "px");
              $(node).css("transform", "rotate(-90deg)");
            }

            elParent.append(node);
          }
        }
      }

      

      // show descriptions of the minimum and maximum values on X axis
      if ( criteria[0].descriptionMin && criteria[0].descriptionMin.length > 0 )
      {
        g.append("text")
          .attr("y", (item_data.height - config.padding*0.6) )
          .attr("x", (item_data.width * 0.2) )
          .attr("dy", "1em")
          .style("text-anchor", "middle")
          .text(criteria[0].descriptionMin);
      }
      if ( criteria[0].descriptionMax && criteria[0].descriptionMax.length > 0 )
      {
        g.append("text")
          .attr("y", (item_data.height - config.padding*0.6) )
          .attr("x", (item_data.width * 0.8) )
          .attr("dy", "1em")
          .style("text-anchor", "middle")
          .text(criteria[0].descriptionMax);
      }

      // show descriptions of the minimum and maximum values on Y axis
      if ( criteria[1].descriptionMin && criteria[1].descriptionMin.length > 0 )
      {
        g.append("text")
          .attr("transform", "rotate(-90)")
          .attr("y", (0) )
          .attr("x", (0 - item_data.height * 0.8) )
          .attr("dy", (config.padding * 0.5) + "px")
          .style("text-anchor", "middle")
          .text(criteria[1].descriptionMin);
      }
      if ( criteria[1].descriptionMax && criteria[1].descriptionMax.length > 0 )
      {
        g.append("text")
          .attr("transform", "rotate(-90)")
          .attr("y", (0) )
          .attr("x", (0 - item_data.height * 0.2) )
          .attr("dy", (config.padding * 0.5) + "px")
          .style("text-anchor", "middle")
          .text(criteria[1].descriptionMax);
      }





      // draw the cursor (inner disc)
      svg.append("circle")
        .attr("cx", xScale(criterionXValue))
        .attr("cy", yScale(criterionYValue))
        .attr("r", 7)
        .style("fill", ( item_data.colorCursor ) ? item_data.colorCursor : "blue")
        .style("cursor", "pointer")
      ;

      // draw the cursor (outer circle)
      svg.append("circle")
        .attr("cx", xScale(criterionXValue))
        .attr("cy", yScale(criterionYValue))
        .attr("r", 10) 
        .style("fill", "none")
        .style("stroke", ( item_data.colorCursor ) ? item_data.colorCursor : "blue")
        .style("cursor", "pointer")
      ;

    
    };



    $scope.drawUIWithTable = function(){
      console.log("drawUIWithTable()");
      var config = $scope.settings;
      var holder = d3.select("#d3_container");

      var table = $("<table/>");
      table.attr("id","table_vote");
      $("#d3_container").append(table);
      var tr = $("<tr/>");
      var tr2 = $("<tr/>");
      table.append(tr);
      table.append(tr2);

      // first column: description of which idea the user will vote on
      if (config.presentationText)
      {
        var td = $("<th/>");
        td.text("Description"); // TODO: i18n
        tr.append(td);
        var td2 = $("<td/>");
        td2.text(config.presentationText);
        tr2.append(td2);
      }

      for ( var i = 0; i < config.items.length; ++i )
      {
        console.log(i);
        var item = config.items[i];


        var td = $("<th/>");
        if ( item.criteria && item.criteria.length > 0 )
        {
          if ( item.criteria.length == 1 && item.criteria[0].name )
            td.text(item.criteria[0].name);
          else
          {
            var a = [];
            for ( var j = 0; j < item.criteria.length; ++j )
            {
              if ( item.criteria[j].name )
                a.push ( item.criteria[j].name );
            }
            td.text(a.join(" / "));
          }
        }
        
        tr.append(td);

        var td2 = $("<td/>");
        td2.attr("id","table_vote_item_"+i);
        tr2.append(td2);
        var holder = d3.select("#table_vote_item_"+i);

        
        //console.log("item.type:");
        //console.log(item.type);
        if ( item.type == "vertical_gauge" )
        {
          $scope.drawVerticalGauge(holder, item);
        }
        else if ( item.type == "2_axes" )
        {
          $scope.draw2AxesVote(holder, item);
        }
      }

      console.log("drawUIWithTable() completed");
    };


    $scope.drawUIWithoutTable = function(){
      console.log("drawUIWithoutTable()");
      var config = $scope.settings;
      var holder = d3.select("#d3_container");
      var jq_holder = $("#d3_container");

      if ( "items" in config ){
      for ( var i = 0; i < config.items.length; ++i )
      {
        var item = config.items[i];
        //console.log("item.type:");
        //console.log(item.type);
        if ( item.type == "vertical_gauge" )
        {
          $scope.drawVerticalGauge(holder, item);

          /*
          // add specific vote button for this criterion
          console.log("item.criteria:");
          console.log(item.criteria);
          if ( item.criteria && item.criteria.length && item.criteria[0] && item.criteria[0]["@id"] )
          {
            var criterion_id = item.criteria[0]["@id"];
            console.log("criterion_id id:");
            console.log(criterion_id);
            console.log("configService.voting_urls:");
            console.log(configService.voting_urls);
            if ( configService.voting_urls && configService.voting_urls[criterion_id] )
            {
              console.log("configService.voting_urls[criterion_id]:");
              console.log(configService.voting_urls[criterion_id]);
              var criterion_endpoint = AssemblToolsService.resourceToUrl(configService.voting_urls[criterion_id]);
              //jq_holder.append("<a href='#' ng-click=\"submitSingleVote('"+criterion_endpoint+"', 'LickertIdeaVote', '"+criterion_id+"')\">Vote</a>").click(function(){
              var link = $("<button>Vote</button>");
              link.click(function(){ // TODO: does not work, all buttons call with the same parameter value
                console.log("coucou");
                $scope.submitSingleVote(criterion_endpoint, 'LickertIdeaVote', item.criteria[0]["id"]);
              });
              jq_holder.append(link);
            }
          }
          */


        }
        else if ( item.type == "2_axes" )
        {
          $scope.draw2AxesVote(holder, item);
        }
      }
      }

      console.log("drawUIWithoutTable() completed");
    };

}]);

"use strict";

creativityApp.controller('adminConfigureInstanceCtl',
    ['$scope', '$http', '$routeParams', '$log', '$location', 'globalConfig', 'configTestingService', 'configService', 'Discussion', 'AssemblToolsService',
        function($scope, $http, $routeParams, $log, $location, globalConfig, configTestingService, configService, Discussion, AssemblToolsService) {

          $scope.current_step = 1;
          $scope.current_substep = 1;

          $scope.widget_uri = null; // "local:Widget/24"
          $scope.widget_endpoint = null; // "/data/Widget/24"
          $scope.target = null;

          $scope.init = function() {
            console.log("adminConfigureInstanceCtl::init()");

            $scope.widget_uri = $routeParams.widget_uri;
            console.log($scope.widget_uri);

            if (!$scope.widget_uri) {
              alert("Please provide a 'widget_uri' URL parameter.");
              $location.path("/admin");
            }

            $scope.target = $routeParams.target;

            $scope.widget_endpoint = AssemblToolsService.resourceToUrl($scope.widget_uri);
          };

          $scope.deleteThisWidget = function() {
            var approve = confirm("Do you confirm that you want to delete this widget instance?"); // TODO: i18n
            if (approve)
            {
              $scope.deleteWidget($scope.widget_endpoint, $("#widget_delete_result"));
            }
          };

          $scope.deleteWidget = function(endpoint, result_holder) {
            $http({
              method: 'DELETE',
              url: endpoint,
              headers: {'Content-Type': 'application/x-www-form-urlencoded'}
            }).success(function(data, status, headers) {
              console.log("success");
              result_holder.text("Success!");
              alert("The widget has been successfully deleted!"); // TODO: i18n
              window.parent.exitModal();
            }).error(function(status, headers) {
              console.log("error");
              result_holder.text("Error");
            });
          };
        }

    ]
);

creativityApp.controller('adminConfigureInstanceSetModulesCtl',
    ['$scope', '$http', '$routeParams', '$log', '$location', 'globalConfig', 'configTestingService', 'configService', 'Discussion', 'AssemblToolsService', 'WidgetService',
        function($scope, $http, $routeParams, $log, $location, globalConfig, configTestingService, configService, Discussion, AssemblToolsService, WidgetService) {

          $scope.current_step = 1;
          $scope.current_substep = 1;

          $scope.widget_uri = null; // "local:Widget/24"
          $scope.widget_endpoint = null; // "/data/Widget/24"
          $scope.target = null;
          $scope.widget = null;
          $scope.discussion_uri = null; // "local:Discussion/1"

          $scope.init = function() {
            console.log("adminConfigureInstanceSetModulesCtl::init()");

            $scope.widget_uri = $routeParams.widget_uri;
            console.log($scope.widget_uri);

            if (!$scope.widget_uri) {
              alert("Please provide a 'widget_uri' URL parameter.");
              $location.path("/admin");
            }

            $scope.target = $routeParams.target;

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

            // associate actions to forms

            $("#widget_set_modules").on("submit", function() {
              $scope.applyWidgetSettings(
                  $("#widget_select_modules_result")
              );
            });
          };

          $scope.updateOnceWidgetIsReceived = function() {
            $scope.discussion_uri = $scope.widget.discussion;

            $scope.current_step = 2;
            $scope.current_substep = 1;
          };

          $scope.applyWidgetSettings = function(result_holder) {
            console.log("applyWidgetSettings()");

            var endpoint = $scope.widget_endpoint + "/settings";
            var post_data = $scope.widget.settings;
            WidgetService.putJson(endpoint, post_data, result_holder);
          };
        }]);

creativityApp.controller('adminConfigureInstanceSetAssociatedIdeasCtl',
  ['$scope', '$http', '$routeParams', '$log', '$location', 'globalConfig', 'configTestingService', 'configService', 'Discussion', 'AssemblToolsService', 'WidgetService', 
  function($scope, $http, $routeParams, $log, $location, globalConfig, configTestingService, configService, Discussion, AssemblToolsService, WidgetService) {

    $scope.current_step = 1;
    $scope.current_substep = 1;

    $scope.widget_uri = null; // "local:Widget/24"
    $scope.widget_endpoint = null; // "/data/Widget/24"
    $scope.target = null;
    $scope.widget = null;
    $scope.discussion_uri = null; // "local:Discussion/1"
    $scope.ideas = null; // list of all ideas of the discussion
    $scope.associated_ideas_url = null; // "local:Discussion/1/widgets/66/criteria"
    $scope.associated_ideas_endpoint = null; // "/data/Discussion/1/widgets/66/criteria"
    $scope.associated_ideas = null; // array of ideas (their full structure)

    $scope.init = function() {
    console.log("adminConfigureInstanceSetAssociatedIdeasCtl::init()");

    $scope.widget_uri = $routeParams.widget_uri;
    console.log($scope.widget_uri);

    if (!$scope.widget_uri)
    {
      alert("Please provide a 'widget_uri' URL parameter.");
      $location.path("/admin");
    }

    $scope.target = $routeParams.target;

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

    // associate actions to forms

    $("#widget_set_associated_ideas").on("submit", function() {
      $scope.associateIdeas(
        $scope.associated_ideas,
        $("#widget_set_associated_ideas_result")
      );
    });
  };

    $scope.updateOnceWidgetIsReceived = function() {
    $scope.discussion_uri = $scope.widget.discussion;

    // FIXME: does not work => works on GET, but error 404 on PUT
    //$scope.associated_ideas_url = $scope.widget.votables_url;
    // does not work either
    $scope.associated_ideas_url = $scope.widget_endpoint + "/idea_links";
    console.log("$scope.associated_ideas_url: ", $scope.associated_ideas_url);
    
    console.log("$scope.widget: ", $scope.widget);

    // TODO: correct endpoint (seems to be not available yet on API side)
    $scope.associated_ideas_endpoint = AssemblToolsService.resourceToUrl($scope.associated_ideas_url);
    console.log("$scope.associated_ideas_endpoint: ", $scope.associated_ideas_endpoint);

    // TODO: correct associated ideas list (seems to be not available yet on API side)
    $scope.associated_ideas = $scope.widget.associated_ideas; // should we transform this data? we do not get the shortTitles
    console.log("$scope.associated_ideas:");
    console.log($scope.associated_ideas);

    $scope.current_step = 2;
    $scope.current_substep = 1;

    // get the list of ideas in this discussion

    var ideas_endpoint_url = AssemblToolsService.resourceToUrl($scope.discussion_uri) + '/ideas?view=default';
    $http({
      method: 'GET',
      url: ideas_endpoint_url,
    }).success(function(data, status, headers) {
      console.log(data);
      $scope.current_substep = 2;
      $scope.ideas = data;
    });
  };

    $scope.associateIdeas = function(ideas, result_holder) {
    console.log("associateIdeas()");
    var post_data = ideas; // maybe we should send only an array of @id fields instead of the whole ideas
    var endpoint = $scope.associated_ideas_endpoint;
    console.log("associateIdeas() is calling putJson() with params: ", endpoint, post_data, result_holder);
    WidgetService.putJson(endpoint, post_data, result_holder);
  };
  }]);

creativityApp.controller('adminCreateFromIdeaCtl',
    ['$scope', '$http', '$routeParams', '$log', '$location', 'globalConfig', 'configTestingService', 'configService', 'Discussion', 'AssemblToolsService',
        function($scope, $http, $routeParams, $log, $location, globalConfig, configTestingService, configService, Discussion, AssemblToolsService) {

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

            //console.log($routeParams.idea);
            $scope.url_parameter_idea = $routeParams.idea;
            $http({
              method: 'GET',
              url: AssemblToolsService.resourceToUrl($scope.url_parameter_idea)
            }).success(function(data, status, headers) {
              //console.log(data);
              $scope.idea = data;
              $scope.discussion_uri = data.discussion;

              $http({
                method: 'GET',
                url: AssemblToolsService.resourceToUrl($scope.discussion_uri)
              }).success(function(data, status, headers) {
                // console.log(data);
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
                  { 'idea': $("#widget_create_without_settings_idea").val() }, //null,
                  $("#widget_create_without_settings_result")
              );
            });

          };

          // settings can be null
          $scope.createWidgetInstance = function(endpoint, widget_type, settings, result_holder) {

            var post_data = {
              "type": widget_type
            };

            if (settings != null) {
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

creativityApp.controller('adminCtl',
    ['$scope', '$http', '$routeParams', '$log', '$location', 'globalConfig', 'configTestingService', 'configService', 'Discussion', 'AssemblToolsService', 'WidgetService',
        function($scope, $http, $routeParams, $log, $location, globalConfig, configTestingService, configService, Discussion, AssemblToolsService, WidgetService) {

          $scope.init = function() {
            console.log("adminCtl::init()");

            $scope.current_step = 1;
            $scope.widget_endpoint = null;
            $scope.widget_data = null; // the content received from the widget endpoint
            $scope.widget_settings_endpoint = null;
            $scope.widget_criteria_endpoint = null;

            $("#widget_create_without_settings").on("submit", function() {
              $scope.createWidgetInstance(
                  $("#widget_create_without_settings_api_endpoint").val(),
                  $("#widget_create_without_settings_type").val(),
                  null,
                  $("#widget_create_without_settings_result")
              );
            });

            $("#step_set_settings").on("submit", function() {
              $scope.setWidgetSettings(
                  $("#set_settings_api_endpoint").val(),
                  $("#set_settings_settings").val(),
                  $("#set_settings_result")
              );
            });

            $("#widget_create").on("submit", function() {
              $scope.createWidgetInstance(
                  $("#widget_create_api_endpoint").val(),
                  $("#widget_create_type").val(),
                  $("#widget_create_settings").val(),
                  $("#widget_create_result")
              );
            });

            $("#criterion_add").on("submit", function() {
              $scope.addCriterion(
                  $("#criterion_add_api_endpoint").val(),
                  $("#criterion_add_id").val(),
                  $("#criterion_add_result")
              );
            });

            $("#idea_children_to_criteria").on("submit", function() {
              $scope.ideaChildrenToCriteria(
                  $("#idea_children_to_criteria_endpoint").val(),
                  $("#idea_children_to_criteria_result")
              );
            });

            $("#criteria_set").on("submit", function() {
              $scope.setCriteria(
                  $("#criteria_set_endpoint").val(),
                  $("#criteria_set_criteria").val(),
                  $("#criteria_set_result")
              );
            });

            $("#criterion_remove").on("submit", function() {
              $scope.removeCriterion(
                  $("#criterion_remove_api_endpoint").val(),
                  $("#criterion_remove_id").val(),
                  $("#criterion_remove_result")
              );
            });

            $("#widget_delete").on("submit", function() {
              $scope.deleteWidget(
                  $("#widget_delete_widget_endpoint").val(),
                  $("#widget_delete_result")
              );
            });

          };

          $scope.ideaChildrenToCriteria = function(endpoint, result_holder) {
            $http({
              method: 'GET',
              url: endpoint
            }).success(function(data, status, headers) {
              console.log("success");
              console.log("data:");
              console.log(data);
              var criteria = data;
              var criteria_output = [];
              if (criteria && criteria.length && criteria.length > 0) {
                for (var i = 0; i < criteria.length; ++i) {
                  //criteria_output.push({ "@id": criteria[i], "short_title": "criterion "+i });
                  criteria_output.push({ "@id": criteria[i] });
                }

                result_holder.append("Success! Transformed data follows:<br/><textarea>" + JSON.stringify(criteria_output) + "</textarea>");
              }
              else {
                console.log("error while parsing the result of the API call");
              }
            }).error(function(status, headers) {
              console.log("error");
            });
          };

          $scope.updateOnceWidgetIsCreated = function() {
            $http({
              method: 'GET',
              url: $scope.widget_endpoint

              //data: $.param(post_data),
              //headers: {'Content-Type': 'application/json'}
              //headers: {'Content-Type': 'application/x-www-form-urlencoded'}
            }).success(function(data, status, headers) {
              console.log("success");
              $scope.widget_data = data;
              if (!data.widget_settings_url) {
                console.log("error: widget data does not contain a widget_settings_url property");
                return;
              }

              $scope.widget_settings_endpoint = AssemblToolsService.resourceToUrl(data.widget_settings_url);
              $("#set_settings_api_endpoint").val($scope.widget_settings_endpoint);

              $("#criterion_add_api_endpoint").val($scope.widget_criteria_endpoint);
              $scope.widget_criteria_endpoint = AssemblToolsService.resourceToUrl(data.criteria_url);

              ++$scope.current_step;
            }).error(function(status, headers) {
              console.log("error");
            });
          };

          // settings can be null
          $scope.createWidgetInstance = function(endpoint, widget_type, settings, result_holder) {

            var post_data = {
              "type": widget_type
            };

            if (settings != null) {
              post_data["settings"] = settings;
            }

            $http({
              method: 'POST',
              url: endpoint,
              data: $.param(post_data),
              async: true,

              //headers: {'Content-Type': 'application/json'}
              headers: {'Content-Type': 'application/x-www-form-urlencoded'}
            }).success(function(data, status, headers) {
              console.log("success");
              var created_widget = headers("Location"); // "local:Widget/5"
              console.log("created_widget: " + created_widget);
              $scope.widget_endpoint = AssemblToolsService.resourceToUrl(created_widget);
              result_holder.text("Success! Location: " + created_widget);
              $scope.updateOnceWidgetIsCreated();
            }).error(function(status, headers) {
              console.log("error");
              result_holder.text("Error");
            });
          };

          $scope.setWidgetSettings = function(endpoint, settings, result_holder) {
            console.log("setWidgetSettings()");

            var post_data = settings;
            WidgetService.putJson(endpoint, post_data, result_holder);
          };

          $scope.addCriterion = function(endpoint, criterion_id, result_holder) {
            var post_data = {
              "id": criterion_id
            };

            $http({
              method: 'POST',
              url: endpoint,
              data: $.param(post_data),
              async: true,
              headers: {'Content-Type': 'application/x-www-form-urlencoded'}
            }).success(function(data, status, headers) {
              console.log("success");
              result_holder.text("Success!");
            }).error(function(status, headers) {
              console.log("error");
              result_holder.text("Error");
            });
          };

          $scope.removeCriterion = function(endpoint, criterion_id, result_holder) {
            var criterion_id_last_part = criterion_id.substr(criterion_id.lastIndexOf("/") + 1);

            $http({
              method: 'DELETE',
              url: endpoint + "/" + criterion_id_last_part,

              //data: $.param(post_data),
              headers: {'Content-Type': 'application/x-www-form-urlencoded'}
            }).success(function(data, status, headers) {
              console.log("success");
              result_holder.text("Success!");
            }).error(function(status, headers) {
              console.log("error");
              result_holder.text("Error");
            });
          };

          $scope.setCriteria = function(endpoint, criteria, result_holder) {
            var post_data = criteria;
            WidgetService.putJson(endpoint, post_data, result_holder);
          };

          $scope.deleteWidget = function(endpoint, result_holder) {
            $http({
              method: 'DELETE',
              url: endpoint,
              headers: {'Content-Type': 'application/x-www-form-urlencoded'}
            }).success(function(data, status, headers) {
              console.log("success");
              result_holder.text("Success!");
            }).error(function(status, headers) {
              console.log("error");
              result_holder.text("Error");
            });
          };

        }]);

creativityApp.controller('indexCtl',
    ['$scope', '$http', '$routeParams', '$log', '$location', 'globalConfig', 'configTestingService', 'configService', 'Discussion', 'AssemblToolsService', 'WidgetService',
        function($scope, $http, $routeParams, $log, $location, globalConfig, configTestingService, configService, Discussion, AssemblToolsService, WidgetService) {

          // intialization code (constructor)

          $scope.init = function() {
            console.log("indexCtl::init()");

            $scope.ready = false;
            console.log("configService:");
            console.log(configService);
            $scope.settings = configService.settings;
            console.log("settings 0:");
            console.log($scope.settings);

            $scope.config = configService.config; //$routeParams.config;
            console.log("$scope.config: ", $scope.config);
            $scope.target = configService.target; //$routeParams.target;

            if (!$scope.target) {
              console.log("Error: please provide a 'target' parameter");
            }

            $scope.locale = configService.locale; //$routeParams.locale;
            $scope.localeAsParameter = $scope.locale ? "&locale=" + $scope.locale : "";

            $scope.active_modules = {};

            console.log("$scope.settings.active_modules: ", $scope.settings.active_modules);
            if ($scope.settings.active_modules) {
              if ($scope.settings.active_modules.video && $scope.settings.active_modules.video == true) {
                $scope.active_modules.video = {};
                $scope.active_modules.video.name = "creativityModuleTitleVideos";

                /*
                $scope.active_modules.video.url = "/widget/video/";
                if ($scope.config)
                    $scope.active_modules.video.url += "?config=" + $scope.config;
                if ($scope.target)
                    $scope.active_modules.video.url += "#/?idea=" + $scope.target;
                */
                
                $scope.active_modules.video.url = "/static/widget/video/?"
                    + $scope.localeAsParameter + "#/?";
                if ($scope.config)
                    $scope.active_modules.video.url += "&config=" + $scope.config;
                if ($scope.target)
                    $scope.active_modules.video.url += "&idea=" + $scope.target;
                        
                if (!/%3F/.test($scope.target)) // TODO: better test (test that the urlencoded view param is not present)
                    $scope.active_modules.video.url += encodeURIComponent("?view=creativity_widget");

                // gives: http://localhost:6543/widget/video/?config=http%3A%2F%2Flocalhost%3A6543%2Fdata%2FWidget%2F43#/?idea=http%3A%2F%2Flocalhost%3A6543%2Fdata%2FIdea%2F3%3Fview%3Dcreativity_widget
              }

              if ($scope.settings.active_modules.card && $scope.settings.active_modules.card == true) {
                $scope.active_modules.card = {};
                $scope.active_modules.card.name = "creativityModuleTitleCards";

                // TODO: verify URL format
                        
                $scope.active_modules.card.url = "/static/widget/card/?"
                    + $scope.localeAsParameter + "#/?";
                if ($scope.config)
                    $scope.active_modules.card.url += "&config=" + AssemblToolsService.resourceToUrl($scope.config);
                if ($scope.target)
                    $scope.active_modules.card.url += "&idea=" + $scope.target;
                if (!/%3F/.test($scope.target)) // TODO: better test (test that the urlencoded view param is not present)
                    $scope.active_modules.card.url += encodeURIComponent("?view=creativity_widget");
              }
            }

            console.log("$scope.active_modules: ", $scope.active_modules);

            // if there is only one active module, redirect to it directly (instead of showing a selection on 1 element)
            var keys = Object.keys($scope.active_modules);
            if (keys.length == 1)
            {
              window.location.replace($scope.active_modules[keys[0]].url);
            }
            else
                {
                  $scope.ready = true;
                }
          };

        }]);

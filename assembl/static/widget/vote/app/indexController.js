"use strict";

voteApp.controller('indexCtl',
  ['$scope', '$http', '$routeParams', '$log', '$location', '$translate', 'globalConfig', 'configTestingService', 'configService', 'Discussion', 'AssemblToolsService', 'VoteWidgetService',
  function($scope, $http, $routeParams, $log, $location, $translate, globalConfig, configTestingService, configService, Discussion, AssemblToolsService, VoteWidgetService) {

    // intialization code (constructor)

    $scope.init = function() {
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

      if ($scope.settings.items && $scope.settings.items.length)
      {
        _.each($scope.settings.items, function(el) {
          VoteWidgetService.addDefaultFields(el, VoteWidgetService.mandatory_item_fields);
          VoteWidgetService.addDefaultFields(el, VoteWidgetService.optional_item_fields);
          if ("vote_specifications" in el && el.vote_specifications.length) {
            _.each(el.vote_specifications, function(el2) {
              VoteWidgetService.addDefaultFields(el2, VoteWidgetService.mandatory_criterion_fields);
              
              if ("@type" in el2 && el2["@type"] in VoteWidgetService.mandatory_typed_criterion_fields) {
                VoteWidgetService.addDefaultFields(el2, VoteWidgetService.mandatory_typed_criterion_fields[el2["@type"]]);
              }

              VoteWidgetService.addDefaultFields(el2, VoteWidgetService.optional_criterion_fields);

              if ("@type" in el2 && el2["@type"] in VoteWidgetService.optional_typed_criterion_fields) {
                VoteWidgetService.addDefaultFields(el2, VoteWidgetService.optional_typed_criterion_fields[el2["@type"]]);
              }
            });
          }
        });
      }

      console.log("settings 2:");
      console.log($scope.settings);

      // check that the user is logged in
      if (!configService.user || !configService.user.verified)
      {
        alert('You have to be authenticated to vote. Please log in and try again.');
        window.location.assign("/login");
        return;
      }

      $scope.user = configService.user;
      
      // check that the user has the "vote" permission

      var widget = configService;
      var discussion_id = "discussion" in widget ? widget.discussion : null;
      if ( discussion_id ){
        var user = "user" in widget ? widget.user : null;
        if ( user ){
          var permissions = "permissions" in user ? user.permissions : null;
          if ( permissions && (discussion_id in permissions) ){
            var permissions_for_discussion = permissions[discussion_id];
            if ( permissions_for_discussion.length && permissions_for_discussion.indexOf("vote") ){
              // OK we are sure that the user has the permission to vote
              console.log("OK we are sure that the user has the permission to vote");
            }
            else {
              alert("Error: you do not have the permission to vote.");
              return;
            }
          }
        }
      }

      $scope.initVotingForAllTargets();

      /*
      // try to get previous votes of the user

      if (!configService.user_votes_url)
      {
        $scope.drawUI();
      }
      else
      {
        var my_votes_endpoint_url = AssemblToolsService.resourceToUrl(configService.user_votes_url);
        $http({
          method: 'GET',
          url: my_votes_endpoint_url,
        }).success(function(data, status, headers) {
          console.log("user votes received: ", data);
          var my_votes = data;

          // override default value of given criteria
          if ("items" in $scope.settings)
          _.each($scope.settings.items, function(item, item_index) {
            if ("vote_specifications" in item)
            _.each(item.vote_specifications, function(criterion, criterion_index) {
              var entity_id = criterion["@id"];
              var my_vote_for_this_criterion = _.findWhere(my_votes, {"vote_spec": entity_id});
              if (my_vote_for_this_criterion)
              {
                console.log("value found: " + my_vote_for_this_criterion.value);
                var new_value = my_vote_for_this_criterion.value;

                // interpret vote value differently depending on criterion type
                if (my_vote_for_this_criterion["@type"] == "BinaryIdeaVote")
                {
                  console.log("criterion type is BinaryIdeaVote");
                  if (my_vote_for_this_criterion.value === true || my_vote_for_this_criterion.value == "true" || my_vote_for_this_criterion.value === 1 || my_vote_for_this_criterion.value == "1")
                  {
                    new_value = 1;
                  }
                  else if (my_vote_for_this_criterion.value === false || my_vote_for_this_criterion.value == "false" || my_vote_for_this_criterion.value === 0 || my_vote_for_this_criterion.value == "0")
                  {
                    new_value = 0;
                  }
                } else // if ( criterion["@type"] == "LickertIdeaVote" )
                {
                  //var valueMin = "minimum" in criterion ? parseFloat(criterion.minimum) : 0;
                  //var valueMax = "maximum" in criterion ? parseFloat(criterion.maximum) : 100;
                  //new_value = valueMin + my_vote_for_this_criterion.value * (valueMax - valueMin);

                  new_value = my_vote_for_this_criterion.value;
                }
                
                $scope.settings.items[item_index].vote_specifications[criterion_index].valueDefault = new_value;
                console.log("value set: " + new_value);
              } else {
                console.log("error: we could not find a definition of this criterion for which the user has voted: ", entity_id);
              }
            });
          });
          console.log("settings after my votes:");
          console.log($scope.settings);
          $scope.drawUI();
        }).error(function(status, headers) {
          console.log("error");
          $scope.drawUI();
        });
      }
      */

    };

    $scope.initVotingForAllTargets = function(){
      /*
      v0:
      (this is not very nice, maybe the backend should send us directly all data in one API call)
      - get all targets, by querying http://localhost:6543/data/Widget/16/targets
      - for each target, query http://localhost:6543/data/Widget/16?target={target["@id"]}
        - save/aggregate its content
      - display each question/criterion, and for each of them display a vote item for each target

      v1:
      - for each question (= each element of settings.item, optionally ordered by question_id of its vote specifications)
        - display question and description
        - for each target (= in an widget.vote_specifications element, list all the keys of its voting_urls field)
          - show target idea title (optionnaly with a link to the idea)
          - show voting item
            - get user previous vote on item's criteria for this target, if any (my_votes field of the vote specification, filtered by the value of idea) => if that's the case, pre-fill item with user votes
        - show vote button
      */

      var widget = configService;

      // create list of targets from voting_urls field (associative array) of widget.vote_specifications (we use only first element because we assume all vote specifications of this vote widget instance have the same set of targets)

      var target = window.getUrlVariableValue("target");
      var targets = window.getUrlVariableValue("targets");
      if ( target ){
        $scope.targets_ids = [target];
        $scope.target = target; // shorcut for the unique target
      }
      else if ( targets ){
        $scope.targets_ids = targets.split(",");
        $scope.target = null;
      }
      else {
        $scope.targets_ids = null;
        $scope.target = null;
      }

      if ( !$scope.targets_ids ){
        var vote_specifications = "vote_specifications" in widget ? widget.vote_specifications : null;
        if ( vote_specifications && vote_specifications.length ){
          var vote_spec = vote_specifications[0];
          var voting_urls = "voting_urls" in vote_spec ? vote_spec.voting_urls : null;
          console.log("voting_urls: ", voting_urls);
          console.log("Object.keys(voting_urls): ", Object.keys(voting_urls));
          if ( voting_urls && Object.keys(voting_urls).length ){
            $scope.targets_ids = Object.keys(voting_urls);
            if ( $scope.targets_ids && $scope.targets_ids.length == 1 ){
              $scope.target = $scope.targets_ids[0];
            }
          }
        }
      }
      console.log("$scope.targets_ids: ", $scope.targets_ids);
      console.log("$scope.target: ", $scope.target);

      $scope.targets_promises = {}; // {"local:Idea/228": promise, ...}
      if ( $scope.targets_ids && $scope.targets_ids.length ){
        $scope.targets_ids.forEach(function(target){
          $scope.targets_promises[target] = $.ajax(AssemblToolsService.resourceToUrl(target)); // TODO: add an increasing delay
        });
      }

      $scope.drawUI(true); // should be $scope.drawUI($scope.target === null); but original single-target vote UI is now temporary disabled because does not work correctly since recent changes. So instead, we display a multiple-target UI even for single-target vote.

    };

    // @param multiple_targets: boolean
    $scope.drawUI = function(multiple_targets) {
      // set a background color

      if ($scope.settings.background)
      {
        $("body").css("background", $scope.settings.background);
      }

      // set min width and min height
      
      if ($scope.settings.minWidth)
      {
        $("body").css("min-width", $scope.settings.minWidth + "px");
      }

      if ($scope.settings.minHeight)
      {
        $("body").css("min-height", $scope.settings.minHeight + "px");
      }

      if ( multiple_targets ){
        $scope.drawMultipleTargetsUI();
      }
      else {
        // display the UI in a table of classic way depending on the settings
        if ($scope.settings.displayStyle && $scope.settings.displayStyle == "table")
        {
          $scope.drawUIWithTable();
        }
        else
        {
          $scope.drawUIWithoutTable();
        }
      }

      if ( !multiple_targets ){
        $translate('voteSubmit').then(function(translation) {
          $("body").append($('<button id="vote_submit" ng-click="submitVote()" class="btn btn-primary btn-sm">' + translation + '</button>'));
          $("body").append($('<div id="vote_submit_result_holder"></div>'));
        });
      }
      else {
        $("body").append($('<div id="vote_submit_result_holder"></div>'));
      }
      

      $scope.resizeIframe();
    };

    $scope.resizeIframe = function() {
      console.log("$scope.resizeIframe()");
      if (window.parent && window.parent.resizeIframe)
        window.parent.resizeIframe();
    };

    // @param container: DOM container where to find votes. For example the DOM element of one question, or of the whole page.
    // @returns An object in the form of {"target_id": "local:Idea/228", "criterion_id": "local:AbstractVoteSpecification/20", "value": 10} . The "target_id" field is optional (when there is only one pre-identified vote target).
    $scope.computeMyVotes = function(container) {
      // do not use .data("criterion-value") because jQuery does not seem to read the value set by d3

      container = container || $("#d3_container");

      $scope.myVotes = [];

      // once serialized by $.param(), this will give "rentabilite=10&risque=0&investissement=22222&difficulte_mise_en_oeuvre=50"
      container.find("g.criterion").each(function(index) {
        var valueMin = parseFloat($(this).attr("data-criterion-value-min"));
        var valueMax = parseFloat($(this).attr("data-criterion-value-max"));
        var value = parseFloat($(this).attr("data-criterion-value"));
        var criterion_id = $(this).attr("data-criterion-id");
        var target_id = $(this).attr("data-target-id");
        if ( target_id && !(target_id in $scope.myVotes) ){
          $scope.myVotes[target_id] = {};
        }

        //var valueToPost = (value - valueMin) / (valueMax - valueMin); // the posted value has to be a float in [0;1]
        var valueToPost = value;

        var vote = {
          "criterion_id": criterion_id,
          "value": valueToPost
        };
        if ( target_id ){
          vote["target_id"] = target_id;
        }
        $scope.myVotes.push(vote);
      });

      container.find("div.criterion").each(function(index) {
        var criterion_id = $(this).attr("data-criterion-id");
        var target_id = $(this).attr("data-target-id");
        var value = parseInt($(this).attr("data-criterion-value"));
        console.log("criterion " + criterion_id + " has value " + value);
        if (isNaN(value))
        {
          alert("Error: no value for criterion " + criterion_id);
          return;
        }

        var valueToPost = value; // or maybe !!value
        var vote = {
          "criterion_id": criterion_id,
          "value": valueToPost
        };
        if ( target_id ){
          vote["target_id"] = target_id;
        }
        $scope.myVotes.push(vote);
      });

      return $scope.myVotes;
    };

    $scope.buildValidatedVoteFormat = function(criterion_id, vote_value){
      // determine vote type

      var widget = configService;
      var vote_type = "LickertIdeaVote";

      if ("vote_specifications" in widget) {
        var vote_spec = _.findWhere(widget.vote_specifications, { "@id": criterion_id});
        if (vote_spec && "vote_class" in vote_spec) {
          vote_type = vote_spec.vote_class;
        }
      }

      // validate vote value

      var value = null; // must be float, and contained in the range defined in the criterion
      if (vote_type == "BinaryIdeaVote")
      {
        if (typeof vote_value == 'string')
          value = !!parseInt(vote_value);
        else if (typeof vote_value == 'number')
        {
          value = !!vote_value;
        }
        else
          value = vote_value;
        console.log("new value:", value);
      }
      else if (vote_type == "MultipleChoiceIdeaVote")
      {
        if (typeof vote_value == 'string')
          value = parseInt(vote_value);
        else
          value = vote_value;
      }
      else // if ( vote_type == "LickertIdeaVote" )
      {
        if (typeof vote_value == 'string')
          value = parseFloat(vote_value);
        else
          value = vote_value;
      }

      return {
        "type": vote_type,
        "value": value
      };
    };

    $scope.getVoteSpecByURI = function(uri){
      var widget = configService;
      if ( "vote_specifications" in widget ){
        if ( widget.vote_specifications.length ){
          var sz = widget.vote_specifications.length;
          for ( var i = 0; i < sz; ++i ){
            var vote_spec = widget.vote_specifications[i];
            if ( "@id" in vote_spec && vote_spec["@id"] == uri ){
              return vote_spec;
            }
          }
        }
      }
      return null;
    };

    $scope.submitVote = function(votes_container, result_holder) {
      console.log("submitVote(): ", votes_container, result_holder);
      var votes_to_submit = $scope.computeMyVotes(votes_container);
      console.log("votes_to_submit:", votes_to_submit);
      $scope.myVotes = votes_to_submit;

      var vote_result_holder = result_holder || $("#vote_submit_result_holder");
      vote_result_holder.empty();

      var widget = configService;
      var voting_urls = "voting_urls" in widget ? widget.voting_urls : null;
      var counter = 0;
      if ( !(votes_to_submit && votes_to_submit.length) ){
        var translation = "Error: There is no vote to submit!";
        vote_result_holder.append($("<p class='failure'>" + translation + "</p>"));
        return;
      }
      votes_to_submit.forEach(function(vote){
        // checking that we have enough info from input and configuration
        
        var criterion_id = "criterion_id" in vote ? vote.criterion_id : null;
        var target_id = "target_id" in vote ? vote.target_id : null;
        if ( !criterion_id ){
          console.log("Error: vote has no criterion_id field");
          return;
        }
        var vote_spec = $scope.getVoteSpecByURI(criterion_id);
        if ( !vote_spec ){
          console.log("Error: vote_spec not found");
          return;
        }
        var voting_url = null;
        var target = $scope.target || target_id;
        if ( !target ){
          console.log("Error: no target to vote to!");
          return;
        }
        var target_endpoint = null;
        if ( "voting_urls" in vote_spec && target in vote_spec.voting_urls )
          target_endpoint = vote_spec.voting_urls[target];
        if ( !target_endpoint ){
          console.log("Error: no target endpoint to vote to!");
          return;
        }

        // from here, we do have enough info to proceed

        var url = AssemblToolsService.resourceToUrl(target_endpoint);
        var data_to_post = $scope.buildValidatedVoteFormat(vote.criterion_id, vote.value);
        

        var successForK = function(vote_spec) {
          return function(data, status, headers) {
            console.log("success");

            //alert("success");
            console.log("data:");
            console.log(data);
            console.log("status:");
            console.log(status);
            console.log("headers:");
            console.log(headers);

            var criterion_name = ("settings" in vote_spec && "name" in vote_spec.settings) ? vote_spec.settings.name : null;
            if ( !criterion_name && "@id" in vote_spec ){
              criterion_name = vote_spec["@id"];
            }

            //$location.path( "/voted" );

            /*
            console.log("k: " + vk);
            var criterion_tag = votes_container.find("svg g[data-criterion-id=\"" + vk + "\"]");
            if (!criterion_tag.length)
              criterion_tag = votes_container.find("div.criterion[data-criterion-id=\"" + vk + "\"]");
            var svg = criterion_tag.parent("svg");
            var criterion_name = criterion_tag.attr("data-criterion-name");

            
            //svg.css("background","#00ff00").fadeOut();
            svg.css("background","#00ff00");//.delay(1000).css("background","none");
            setTimeout(function(){svg.css("background","none");}, 1000);
            */

            $translate('voteSubmitSuccessForCriterion', {'criterion': criterion_name}).then(function(translation) {
              vote_result_holder.append($("<p class='success'>" + translation + "</p>"));

              // $scope.resizeIframe(); // our resize function is not good enough yet
            });
          };          
        };

        var errorForK = function(vote_spec) {
          return function(status, headers) {
            console.log("error");

            //alert("error");
            console.log("status:");
            console.log(status);
            console.log("headers:");
            console.log(headers);

            var criterion_name = ("settings" in vote_spec && "name" in vote_spec.settings) ? vote_spec.settings.name : null;
            if ( !criterion_name && "@id" in vote_spec ){
              criterion_name = vote_spec["@id"];
            }

            /*
            console.log("k: " + vk);
            var criterion_tag = $("svg g[data-criterion-id=\"" + vk + "\"]");
            if (!criterion_tag.length)
              criterion_tag = $("div.criterion[data-criterion-id=\"" + vk + "\"]");
            var svg = criterion_tag.parent("svg");
            var criterion_name = criterion_tag.attr("data-criterion-name");

            svg.css("background", "#ff0000");
            setTimeout(function() {svg.css("background", "none");}, 1000);
            */

            $translate('voteSubmitFailureForCriterion', {'criterion': criterion_name}).then(function(translation) {
              vote_result_holder.append($("<p class='failure'>" + translation + "</p>"));

              // $scope.resizeIframe(); // our resize function is not good enough yet
            });
          }
        };

        // we will send votes for each criterion separated with a small delay, so that we avoid server saturation
        // TODO: instead we could chain calls (send a call once the response of the previous one has been received)

        var sendVote = function(url, data_to_post, vote_spec, delay) {
          setTimeout(function() {
            // POST to this URL
            $http({
              method: "POST",
              url: url,
              data: $.param(data_to_post),

              //data: data_to_post,
              headers: {'Content-Type': 'application/x-www-form-urlencoded'}

              //headers: {'Content-Type': 'application/json'}
            }).success(successForK(vote_spec)).error(errorForK(vote_spec));
          }, delay);
        };
          
        sendVote(url, data_to_post, vote_spec, (counter++) * 300);
            
          
      });

    };

    $scope.computeMyVotesForQuestion = function(item_id){
      var myVotes = null;
      var dom_id = "vote-question-item-" + item_id;
      var question = $("#"+dom_id);
      if ( question ){
        myVotes = $scope.computeMyVotes(question);
      }
      return myVotes;
    };

    $scope.submitVotesForQuestion = function(item_id){
      console.log("submitVotesForQuestion(): ", item_id);

      var dom_id = "vote-question-item-" + item_id;
      var question = $("#"+dom_id);
      if ( question ){
        var result_holder = question.children(".vote-question-submit-button-container").children(".vote-question-result"); // or .find()
        if ( !result_holder ){
          result_holder = question.find(".vote-question-result");
        }
        $scope.submitVote(question, result_holder);
      }
    };

    $scope.submitSingleVote = function(endpoint, type, criterion_id) {
      console.log("submitSingleVote() parameters:" + endpoint + " " + type + " " + criterion_id);
      var criterion_value = $("#d3_container g.criterion[data-criterion-id=\"" + criterion_id + "\"]").attr("data-criterion-value");
      console.log("criterion value:");
      console.log(criterion_value);
    };

    // @param destination
    // The d3 container (div)
    // @param item_data
    // One of the elements of the "items" array, from the configuration JSON
    // @param target_id
    // Id of the target votable (for example: "local:Idea/228")
    // @param getUserPreviousVoteFunction
    // function(criterion_id [, target_id]) which returns the user's previous vote for this criterion and this (or current) target
    // @param xPosCenter
    // Position on the X coordinates of the center of the gauge, in the created SVG
    $scope.drawVerticalGauge = function(destination, item_data, target_id, getUserPreviousVoteFunction, xPosCenter) {
      console.log("drawVerticalGauge()");
      console.log("item_data:");
      console.log(item_data);
      var config = $scope.settings;
      if (!("vote_specifications" in item_data && item_data.vote_specifications.length > 0)) {
        console.log("error: this item has no 'vote_specifications' field");
        return;
      }

      var criterion = item_data.vote_specifications[0];
      var valueMin = ("minimum" in criterion) ? criterion.minimum : 0;
      var valueMax = ("maximum" in criterion) ? criterion.maximum : 100;
      var valueDefault = null;
      if ( getUserPreviousVoteFunction ){
        valueDefault = getUserPreviousVoteFunction(criterion["@id"], target_id);
        console.log("getUserPreviousVoteFunction is true => valueDefault: ", valueDefault);
      }
      if ( valueDefault === null || valueDefault === undefined ) {
        valueDefault = ("valueDefault" in criterion) ? criterion.valueDefault : valueMin;
        console.log("valueDefault is null => valueDefault: ", valueDefault);
      }
      var criterionValue = valueDefault;
      target_id = target_id || null;
      console.log("criterionValue: ", criterionValue);
      xPosCenter = xPosCenter ? xPosCenter : item_data.width / 2;
      var width = "width" in item_data ? item_data.width : null;
      if ( !width )
        width = "width" in config ? config.witdth : 300;
      var height = "height" in item_data ? item_data.height : null;
      if ( !height )
        height = "height" in config ? config.height : 300;
      var padding = "padding" in item_data ? item_data.padding : null;
      if ( !padding )
        padding = "padding" in padding ? config.padding : 60;
      
      // create the graph, as a SVG in the d3 container div
      var svg = destination
        .append("svg")
        .attr("width", width)    
        .attr("height", height);

      svg.append("g")
        .attr("class", "criterion")
        .attr("data-criterion-name", criterion.name)
        .attr("data-criterion-id", criterion["@id"]) // contains something like "local:Idea/3"
        .attr("data-criterion-value", criterionValue)
        .attr("data-criterion-value-min", valueMin)
        .attr("data-criterion-value-max", valueMax)
        .attr("data-target-id", target_id)
      ;

      // create vertical scale
      var scale = d3.scale.linear()
        .domain([valueMin, valueMax])
        .range([height - padding, padding])
        .clamp(true);

      var ticks = 5;
      if (criterion.ticks)
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
      if (criterion.colorMin && criterion.colorMax)
      {
        // define a gradient in the SVG (using a "linearGradient" tag inside the "defs" tag). 0% = top; 100% = bottom
        var defs = svg.append("defs");
        var lg = defs.append("linearGradient")
          .attr("id", "gradient_" + criterion.id)
          .attr("x1", "0%")
          .attr("y1", "0%")
          .attr("x2", "0%")
          .attr("y2", "100%");
        lg.append("stop")
          .attr("offset", "0%")
          .style("stop-color", criterion.colorMax)
          .style("stop-opacity", "1");
        if (criterion.colorAverage)
        {
          lg.append("stop")
            .attr("offset", "50%")
            .style("stop-color", criterion.colorAverage)
            .style("stop-opacity", "1");
        }

        lg.append("stop")
          .attr("offset", "100%")
          .style("stop-color", criterion.colorMin)
          .style("stop-opacity", "1");
      }

      var g = svg.append("g");
      
      // show color gradient if set
      var axisBonusClasses = "";
      if (criterion.colorMin && criterion.colorMax)
      {
        axisBonusClasses = "gradient";
        var gradientWidth = 10;
        g.append("rect")
          .attr("x", xPosCenter - gradientWidth / 2)
          .attr("y", padding - 1) // this is the same as .attr("y", scale(criterion.valueMax) )
          .attr("width", gradientWidth)
          .attr("height", scale(valueMin) - padding + 1)
          .attr("fill", "url(#gradient_" + criterion.id + ")");
      }

      // show vertical axis
      g.append("g")
        .attr("class", "axis " + axisBonusClasses)
        .attr("transform", "translate(" + xPosCenter + ",0)")
        .call(axis);

      // if there is a gradient, edit the axis (which we just created) to show ticks differently
      if (criterion.colorMin && criterion.colorMax)
      {
        g.selectAll("line")
          .attr("x1", "-2")
          .attr("x2", "2");
      }

      // show axis label
      var axisLabel = g.append("text")
        .attr("y", height - padding * 0.3)
        .attr("x", xPosCenter)
        .attr("class", "axis-label")
        .text(criterion.name);

      // make the axis label interactive (mouse hover) to show the description text of the criterion
      // possibility of improvement: maybe instead of an HTML "title" attribute, we could use tipsy, as on http://bl.ocks.org/ilyabo/1373263
      if (!config.showCriterionDescription || config.showCriterionDescription == "tooltip")
      {
        if (criterion.description && criterion.description.length > 0)
        {
          var f = function() {
            // prevent the other click() function to get called
            d3.event.stopPropagation();
            
            // do nothing, so that we just block the other click function in case the user clicks on the axis label because they think it would give more info (info appears on hover after a bit of time, because for now it is handled by the "title" property, so the browser decides how/when it appears)
          }

          axisLabel
            .style("cursor", "help")
            .attr("title", criterion.description)
            .on("click", f)
          ;
        }
      }
      else if (config.showCriterionDescription && config.showCriterionDescription == "text")
      {
        if (criterion.description && criterion.description.length > 0)
        {
          // There is no automatic word wrapping in SVG
          // So we create an HTML element
          var elParent = $("#d3_container");
          var elOrigin = $(svg[0]);
          var text = document.createTextNode(criterion.description);
          var node = document.createElement("span");
          node.appendChild(text);
          var descriptionWidth = width;

          $(node).css("position", "absolute");
          $(node).css("width", descriptionWidth + "px");
          $(node).css("top", elOrigin.offset().top + (height - padding * 0.25) + "px");
          $(node).css("left", (elOrigin.offset().left + xPosCenter - descriptionWidth / 2) + "px");
          $(node).css("text-align", "center");

          elParent.append(node);
        }
      }

      // show descriptions of the minimum and maximum values
      if (criterion.descriptionMin)
      {
        g.append("text")
          .attr("y", height - padding * 0.7)
          .attr("x", xPosCenter)
          .style("text-anchor", "middle")
          .text(criterion.descriptionMin);
      }

      if (criterion.descriptionMax)
      {
        g.append("text")
          .attr("y", padding * 0.7)
          .attr("x", xPosCenter)
          .style("text-anchor", "middle")
          .text(criterion.descriptionMax);
      }

      console.log("criterionValue: ", criterionValue);
      console.log("scale(criterionValue): ", scale(criterionValue));

      // draw the cursor
      svg.append("circle")
        .attr("cx", xPosCenter)
        .attr("cy", scale(criterionValue))
        .attr("r", 8)
        .style("fill", (criterion.colorCursor) ? criterion.colorCursor : "blue")
        .style("cursor", "pointer")
      ;

    };

    // @param destination
    // The d3 container (div)
    // @param item_data
    // One of the elements of the "items" array, from the configuration JSON
    // @param target_id
    // Id of the target votable (for example: "local:Idea/228")
    // @param getUserPreviousVoteFunction
    // function(criterion_id [, target_id]) which returns the user's previous vote for this criterion and this (or current) target
    // @param xPosCenter
    // Position on the X coordinates of the center of the gauge, in the created SVG
    $scope.draw2AxesVote = function(destination, item_data, target_id, getUserPreviousVoteFunction, xPosCenter) {
      console.log("draw2AxesVote()");

      var config = $scope.settings;
      if (!("vote_specifications" in item_data && item_data.vote_specifications.length)) {
        console.log("error: item has no 'vote_specifications' field");
        return;
      }

      var criteria = item_data.vote_specifications;

      if (criteria.length < 2)
      {
        console.log("error: need at least 2 criteria");
        return;
      }

      var criterionXValueMin = ("minimum" in criteria[0]) ? criteria[0].minimum : 0;
      var criterionXValueMax = ("maximum" in criteria[0]) ? criteria[0].maximum : 100;
      var criterionXValueDefault = ("valueDefault" in criteria[0]) ? criteria[0].valueDefault : criterionXValueMin;

      var criterionYValueMin = ("minimum" in criteria[1]) ? criteria[1].minimum : 0;
      var criterionYValueMax = ("maximum" in criteria[1]) ? criteria[1].maximum : 100;
      var criterionYValueDefault = ("valueDefault" in criteria[1]) ? criteria[1].valueDefault : criterionYValueMin;

      var criterionXValue = null;
      var criterionYValue = null;
      if ( getUserPreviousVoteFunction ){
        criterionXValue = getUserPreviousVoteFunction(criteria[0]["@id"], target_id);
        criterionYValue = getUserPreviousVoteFunction(criteria[1]["@id"], target_id);
      }
      if ( criterionXValue === null ){
        criterionXValue = criterionXValueDefault;
      }
      if ( criterionYValue === null ){
        criterionYValue = criterionYValueDefault;
      }
      xPosCenter = xPosCenter ? xPosCenter : item_data.width / 2;
      target_id = target_id || null;

      // create the graph, as a SVG in the d3 container div
      var svg = destination
        .append("svg")
        .attr("width", item_data.width)    
        .attr("height", item_data.height);

      svg.append("g")
        .attr("class", "criterion")
        .attr("data-criterion-name", criteria[0].name)
        .attr("data-criterion-id", criteria[0]["@id"]) // contains something like "local:Idea/3"
        .attr("data-criterion-value", criterionXValue)
        .attr("data-criterion-value-min", criterionXValueMin)
        .attr("data-criterion-value-max", criterionXValueMax)
        .attr("data-criterion-type", "x")
        .attr("data-target-id", target_id)
      ;

      svg.append("g")
        .attr("class", "criterion")
        .attr("data-criterion-name", criteria[1].name)
        .attr("data-criterion-id", criteria[1]["@id"]) // contains something like "local:Idea/3"
        .attr("data-criterion-value", criterionYValue)
        .attr("data-criterion-value-min", criterionYValueMin)
        .attr("data-criterion-value-max", criterionYValueMax)
        .attr("data-criterion-type", "y")
        .attr("data-target-id", target_id)
      ;

      // create X and Y scales
      var xScale = d3.scale.linear()
        .domain([criterionXValueMin, criterionXValueMax])
        .range([config.padding, item_data.width - config.padding])
        .clamp(true);

      var yScale = d3.scale.linear()
        .domain([criterionYValueMin, criterionYValueMax])
        .range([item_data.height - config.padding, config.padding])
        .clamp(true);

      // create X and Y axes using their scales
      var xTicks = 5;
      if (criteria[0].ticks)
        xTicks = criteria[1].ticks;
      var xAxis = d3.svg.axis()
        .scale(xScale)
        .orient("bottom")
        .ticks(xTicks);

      var yTicks = 5;
      if (criteria[1].ticks)
        yTicks = criteria[1].ticks;
      var yAxis = d3.svg.axis()
        .scale(yScale)
        .orient("left")
        .ticks(yTicks);

      function setCirclePositionFromOutputRange(x, y, setData)
      {
        var xValue = xScale.invert(x);
        var yValue = yScale.invert(y);

        if (setData === true)
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

      function dragEnd(d) {
        var x = svg.selectAll("circle").attr("cx");
        var y = svg.selectAll("circle").attr("cy");

        setCirclePositionFromOutputRange(x, y, true);
      }

      // define drag beavior
      var drag = d3.behavior.drag()
        .origin(function() {
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
        .attr("y", (item_data.height - config.padding * 0.45))
        .attr("x", (item_data.width / 2))
        .attr("dy", "1em")
        .attr("class", "axis-label")
        .text(criteria[0].name);

      // show Y axis label
      var yAxisLabel = g.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", (0))
        .attr("x", (0 - item_data.height / 2))
        .attr("dy", config.padding / 3 + "px")
        .attr("class", "axis-label")
        .text(criteria[1].name);

      // make the axis labels interactive (mouse hover) to show the description text of the criterion
      if (!config.showCriterionDescription || config.showCriterionDescription == "tooltip")
      {
        var onClickDoNothing = function() {
          // prevent the other click() function to get called
          d3.event.stopPropagation();
          
          // do nothing, so that we just block the other click function in case the user clicks on the axis label because they think it would give more info (info appears on hover after a bit of time, because for now it is handled by the "title" property, so the browser decides how/when it appears)
        };
        if (criteria[0].description && criteria[0].description.length > 0)
        {
          xAxisLabel
            .style("cursor", "help")
            .attr("title", criteria[0].description)
            .on("click", onClickDoNothing)
          ;
        }

        if (criteria[1].description && criteria[1].description.length > 0)
        {
          yAxisLabel
            .style("cursor", "help")
            .attr("title", criteria[1].description)
            .on("click", onClickDoNothing)
          ;
        }
      }
      else if (config.showCriterionDescription && config.showCriterionDescription == "text")
      {
        for (var i = 0; i < 2; ++i)
        {
          if (criteria[i].description && criteria[i].description.length > 0)
          {
            // There is no automatic word wrapping in SVG
            // So we create an HTML element
            var elParent = $("#d3_container");
            var elOrigin = $(svg[0]);
            var text = document.createTextNode(criteria[i].description);
            var node = document.createElement("span");
            node.appendChild(text);
            var descriptionWidth = item_data.width;
            if (i == 1)
              descriptionWidth = item_data.height;

            $(node).css("position", "absolute");
            $(node).css("width", descriptionWidth + "px");
            $(node).css("top", (elOrigin.offset().top + (item_data.height - config.padding * 0.25)) + "px");
            $(node).css("left", (elOrigin.offset().left + xPosCenter - descriptionWidth / 2) + "px");
            $(node).css("text-align", "center");

            if (i == 1)
            {
              $(node).css("top", (elOrigin.offset().top + (item_data.height / 2)) + "px");
              $(node).css("left", (elOrigin.offset().left - descriptionWidth / 2) + "px");
              $(node).css("transform", "rotate(-90deg)");
            }

            elParent.append(node);
          }
        }
      }

      // show descriptions of the minimum and maximum values on X axis
      if (criteria[0].descriptionMin && criteria[0].descriptionMin.length > 0)
      {
        g.append("text")
          .attr("y", (item_data.height - config.padding * 0.6))
          .attr("x", (item_data.width * 0.2))
          .attr("dy", "1em")
          .style("text-anchor", "middle")
          .text(criteria[0].descriptionMin);
      }

      if (criteria[0].descriptionMax && criteria[0].descriptionMax.length > 0)
      {
        g.append("text")
          .attr("y", (item_data.height - config.padding * 0.6))
          .attr("x", (item_data.width * 0.8))
          .attr("dy", "1em")
          .style("text-anchor", "middle")
          .text(criteria[0].descriptionMax);
      }

      // show descriptions of the minimum and maximum values on Y axis
      if (criteria[1].descriptionMin && criteria[1].descriptionMin.length > 0)
      {
        g.append("text")
          .attr("transform", "rotate(-90)")
          .attr("y", (0))
          .attr("x", (0 - item_data.height * 0.8))
          .attr("dy", (config.padding * 0.5) + "px")
          .style("text-anchor", "middle")
          .text(criteria[1].descriptionMin);
      }

      if (criteria[1].descriptionMax && criteria[1].descriptionMax.length > 0)
      {
        g.append("text")
          .attr("transform", "rotate(-90)")
          .attr("y", (0))
          .attr("x", (0 - item_data.height * 0.2))
          .attr("dy", (config.padding * 0.5) + "px")
          .style("text-anchor", "middle")
          .text(criteria[1].descriptionMax);
      }

      // draw the cursor (inner disc)
      svg.append("circle")
        .attr("cx", xScale(criterionXValue))
        .attr("cy", yScale(criterionYValue))
        .attr("r", 7)
        .style("fill", (item_data.colorCursor) ? item_data.colorCursor : "blue")
        .style("cursor", "pointer")
      ;

      // draw the cursor (outer circle)
      svg.append("circle")
        .attr("cx", xScale(criterionXValue))
        .attr("cy", yScale(criterionYValue))
        .attr("r", 10) 
        .style("fill", "none")
        .style("stroke", (item_data.colorCursor) ? item_data.colorCursor : "blue")
        .style("cursor", "pointer")
      ;

    };

    // @param destination
    // The DOM element which will be used as container (div)
    // @param item_data
    // One of the elements of the "items" array, from the configuration JSON
    // @param target_id
    // Id of the target votable (for example: "local:Idea/228")
    // @param getUserPreviousVoteFunction
    // function(criterion_id [, target_id]) which returns the user's previous vote for this criterion and this (or current) target
    $scope.drawRadioVote = function(destination, item_data, target_id, getUserPreviousVoteFunction) {
      console.log("drawRadioVote()");
      var config = $scope.settings;
      if (!("vote_specifications" in item_data && item_data.vote_specifications.length > 0)) {
        console.log("error: item has no 'vote_specifications' field");
        return;
      }

      var criterion = item_data.vote_specifications[0];
      target_id = target_id || null;

      var criterionValue = null;
      if ( getUserPreviousVoteFunction ){
        var user_previous_vote = getUserPreviousVoteFunction(criterion["@id"], target_id);
        console.log("user_previous_vote: ", user_previous_vote);
        console.log('criterion["@id"]: ', criterion["@id"]);
        console.log('target_id: ', target_id);
        
        // special case of binary vote
        if ( user_previous_vote === true )
          user_previous_vote = 1;
        else if ( user_previous_vote === false )
          user_previous_vote = 0;

        criterionValue = user_previous_vote;
      }
      if ( criterionValue === null && "valueDefault" in criterion ){
        criterionValue = criterion.valueDefault;
      }
      
      var div = $('<div>');
      div.attr({
        'class': 'criterion',
        'data-criterion-id': criterion["@id"],
        'data-criterion-name': criterion.name,
        'data-criterion-value': null,
        'data-target-id': target_id
      });

      // adapt data format from BinaryIdeaVote which has labelYes and labelNo, to PluralityIdeaVote which has possibleValues
      // criterion.possibleValues is like so: [ { label: 'Choice 1', value: 0 }, { label: 'Choice 2', value: 1} ]
      if ('@type' in criterion) {
        if (criterion["@type"] == 'BinaryVoteSpecification') {
          var labelYes = ('labelYes' in criterion) ? criterion.labelYes : 'Yes';
          var labelNo = ('labelNo' in criterion) ? criterion.labelNo : 'No';
          criterion.possibleValues = [
            {
              "label": labelNo,
              "value": 0 // or false?
            },
            {
              "label": labelYes,
              "value": 1 // or true?
            }
          ];
        } else if (criterion["@type"] == 'MultipleChoiceVoteSpecification') {
          criterion.possibleValues = [];
          var i = 0;
          if ("candidates" in criterion)
          criterion.candidates.forEach(function(el) {
            criterion.possibleValues.push({
              "label": el,
              "value": i++
            });
          });
        }
      }

      var updateSelectedValue = function() {
        console.log("updateSelectedValue()");
        var el = div.find('input:checked');
        if (el)
        {
          div.attr('data-criterion-value', el.val());
        }
        else {
          div.attr('data-criterion-value', null);
        }
      };

      if ('possibleValues' in criterion)
      {
        if (!target_id && 'name' in criterion)
        {
          var name = $('<strong>');
          name.text(criterion.name);
          div.append(name);
        }

        if (!target_id && 'description' in criterion)
        {
          var description = $('<p>');
          description.text(criterion.description);
          div.append(description);
        }
        
        $.each (criterion.possibleValues, function(index, item) {
          if ('value' in item && 'label' in item)
          {
            var option = $('<div>');
            var input = $('<input>');
            var radio_id = 'radio_' + criterion["@id"] + '_' + item.value;
            if ( target_id ){
              radio_id = 'radio_' + criterion["@id"] + '_' + target_id + "_" + item.value;
            }
            var input_name = criterion["@id"];
            if ( target_id ){
              input_name = criterion["@id"] + "_" + target_id;
            }
            input.attr({
              type: 'radio',
              name: input_name,
              value: item.value,
              id: radio_id
            });
            if (criterionValue === item.value)
              input.prop("checked", true);
            input.on('change', updateSelectedValue);
            var label = $('<label>');
            label.attr('for', radio_id);
            label.text(item.label);
            option.append(input);
            option.append(label);
            div.append(option);
          }
        });
      }
      
      destination.append(div);

      updateSelectedValue();
    };

    $scope.drawUIWithTable = function() {
      console.log("drawUIWithTable()");
      var config = $scope.settings;
      var holder_svg = null; //d3.select("#d3_container");
      var holder_jquery = null; //$("#d3_container");

      var table = $("<table/>");
      table.attr("id", "table_vote");
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

      for (var i = 0; i < config.items.length; ++i)
      {
        var item = config.items[i];

        var td = $("<th/>");
        if (item.vote_specifications && item.vote_specifications.length > 0)
        {
          if (item.vote_specifications.length == 1 && item.vote_specifications[0].name)
            td.text(item.vote_specifications[0].name);
          else
          {
            var a = [];
            for (var j = 0; j < item.vote_specifications.length; ++j)
            {
              if (item.vote_specifications[j].name)
                a.push (item.vote_specifications[j].name);
            }

            td.text(a.join(" / "));
          }
        }
        
        tr.append(td);

        var td2 = $("<td/>");
        td2.attr("id", "table_vote_item_" + i);
        tr2.append(td2);
        holder_svg = d3.select("#table_vote_item_" + i);
        holder_jquery = $("#table_vote_item_" + i);

        if (item.type == "vertical_gauge")
        {
          $scope.drawVerticalGauge(holder_svg, item);
        }
        else if (item.type == "2_axes")
        {
          $scope.draw2AxesVote(holder_svg, item);
        }
        else if (item.type == "radio")
        {
          $scope.drawRadioVote(holder_jquery, item);
        }
      }

      console.log("drawUIWithTable() completed");
    };

    $scope.drawUIWithoutTable = function() {
      console.log("drawUIWithoutTable()");
      var config = $scope.settings;
      var holder_svg = d3.select("#d3_container");
      var holder_jquery = $("#d3_container");

      if ("items" in config) {
        for (var i = 0; i < config.items.length; ++i)
        {
          var item = config.items[i];

          if (item.type == "vertical_gauge")
          {
            $scope.drawVerticalGauge(holder_svg, item);

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
                //holder_jquery.append("<a href='#' ng-click=\"submitSingleVote('"+criterion_endpoint+"', 'LickertIdeaVote', '"+criterion_id+"')\">Vote</a>").click(function(){
                var link = $("<button>Vote</button>");
                link.click(function(){ // TODO: does not work, all buttons call with the same parameter value
                  console.log("coucou");
                  $scope.submitSingleVote(criterion_endpoint, 'LickertIdeaVote', item.criteria[0]["id"]);
                });
                holder_jquery.append(link);
              }
            }
            */
            
          }
          else if (item.type == "2_axes")
          {
            $scope.draw2AxesVote(holder_svg, item);
          }
          else if (item.type == "radio")
          {
            $scope.drawRadioVote(holder_jquery, item);
          }
        }
      }

      console.log("drawUIWithoutTable() completed");
    };

    $scope.drawMultipleTargetsUI = function() {
      console.log("drawMultipleTargetsUI()");
      var settings = $scope.settings;
      var holder_svg = d3.select("#d3_container");
      var holder_jquery = $("#d3_container");

      // check that there are at least 1 item and at least 1 target
      
      if ( !("items" in settings && settings.items && settings.items.length > 0) ){
        holder_jquery.append($("<p>Error: There is no voting item to display.</p>"));
        return;
      }
      if ( !($scope.targets_ids && $scope.targets_ids.length > 0) ){
        holder_jquery.append($("<p>Error: There is no target to vote on.</p>"));
        return;
      }

      if ("items" in settings) {
        for (var i = 0; i < settings.items.length; ++i)
        {
          var item = settings.items[i];
          var item_type = "type" in item ? item.type : null;
          if ( !item_type ){
            console.log("Error: item has no type. item was: ", item );
            continue;
          }

          var question_holder = $("<section class='vote-question-item' />");
          question_holder.attr("id", "vote-question-item-"+i);
          holder_jquery.append(question_holder);
          var question_holder_d3 = d3.select(question_holder.get(0));
          

          var question_title = "question_title" in item ? item.question_title : null;
          var question_description = "question_description" in item ? item.question_description : null;
          if ( !question_title ){
            if ( item_type == "2_axes"){
              // TODO: display both questions and descriptions? Or nothing as each question is displayed along an axis? Or associate  question and description properties to an item instead of a criterion?
            } else {
              var vote_specifications = "vote_specifications" in item ? item.vote_specifications : null;
              if ( vote_specifications && vote_specifications.length ){
                var vote_spec = vote_specifications[0];
                question_title = ("settings" in vote_spec && "name" in vote_spec.settings) ? vote_spec.settings.name : null;
                question_description = ("settings" in vote_spec && "description" in vote_spec.settings) ? vote_spec.settings.description : null;
              }
            }
          }
          if ( question_title ){
            question_holder_d3.append("h2").classed({"question-title": true}).text(question_title);
            if ( question_description ){
              question_holder_d3.append("div").classed({"question-description": true}).text(question_description);
            }
          }

          var fctGetUserPreviousVote = function(criterion_id, target_id){
            var widget = configService;
            var vote_specifications = "vote_specifications" in widget ? widget.vote_specifications : null;
            if ( vote_specifications && vote_specifications.length ){
              var vote_spec = _.findWhere(vote_specifications, {"@id": criterion_id});
              if ( vote_spec ){
                var my_votes = "my_votes" in vote_spec ? vote_spec.my_votes : null;
                if ( my_votes && my_votes.length ){
                  var vote = _.findWhere(my_votes, {"idea": target_id});
                  if ( vote ){
                    if ( "value" in vote ){
                      return vote.value;
                    }
                    else {
                      return vote;
                    }
                  }
                }
              }
            }
            return null;
          };

          if ( $scope.targets_ids && $scope.targets_ids.length ){
            $scope.targets_ids.forEach(function(target_id){
              //console.log("target currently being displayed: ", target_id);
              var inline_vote_holder = $("<div class='inline-vote-for-a-target' />");
              question_holder.append(inline_vote_holder);
              
              var target_title_holder = $("<div class='inline-vote-for-a-target--title' />");
              inline_vote_holder.append(target_title_holder);
              target_title_holder.text(target_id);
              if ( target_id in $scope.targets_promises ){
                $.when($scope.targets_promises[target_id]).done(function(data){
                  if ( "shortTitle" in data ){
                    target_title_holder.text(data.shortTitle);
                    if ( "definition" in data && data.definition.length ){
                      target_title_holder.attr("title", data.definition); // TODO: but this is HTML :/
                      //for debug: target_title_holder.attr("title", target_id);
                    } 
                    
                  } else {
                    console.log("error: idea ", target_id, "has no shortTitle property");
                  }
                });
              }
              var item_holder = $("<div class='inline-vote-for-a-target--item' />");
              inline_vote_holder.append(item_holder);
              var item_holder_d3 = d3.select(item_holder.get(0));
              if (item_type == "vertical_gauge")
              {
                $scope.drawVerticalGauge(item_holder_d3, item, target_id, fctGetUserPreviousVote);
              }
              else if (item_type == "2_axes")
              {
                $scope.draw2AxesVote(item_holder_d3, item, target_id, fctGetUserPreviousVote);
              }
              else if (item_type == "radio")
              {
                $scope.drawRadioVote(item_holder, item, target_id, fctGetUserPreviousVote);
              }
              
            });
          }

          // after each item, display a "Vote" button which sends the votes of this question
          var translationReceived = function(question_id){
            return function(translation){
              var question_holder = $("#vote-question-item-"+question_id);
              console.log("translation received: ", translation);
              var vote_button_holder = $("<div class='vote-question-submit-button-container'>");
              question_holder.append(vote_button_holder);
              var button = $('<button class="btn btn-primary btn-sm">' + translation + '</button>');
              vote_button_holder.append(button);
              vote_button_holder.append($("<div class='vote-question-result'>"));
              var onButtonClick = function(){
                $scope.submitVotesForQuestion(question_id);
              };
              button.click(onButtonClick);
            };
          }
          $translate('voteSubmitForQuestion').then(translationReceived(i));
          
          
        }
      }

      console.log("drawUIWithoutTable() completed");
    };

  }]);

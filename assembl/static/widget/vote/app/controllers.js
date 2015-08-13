"use strict";

// "Small" controllers are here. When a controller becomes too big (> X lines of code), put it in its own file

voteApp.controller('adminConfigureInstanceCtl',
  ['$scope', '$http', '$routeParams', '$log', '$location', 'globalConfig', 'configTestingService', 'configService', 'Discussion', 'AssemblToolsService', 'VoteWidgetService', 
  function($scope, $http, $routeParams, $log, $location, globalConfig, configTestingService, configService, Discussion, AssemblToolsService, VoteWidgetService) {

    $scope.current_step = 1;
    $scope.current_substep = 1;

    $scope.widget_uri = null; // "local:Widget/24"
    $scope.widget_endpoint = null; // "/data/Widget/24"
    $scope.target = null;

    $scope.init = function() {
    console.log("adminConfigureInstanceCtl::init()");

    $scope.widget_uri = $routeParams.widget_uri;
    console.log($scope.widget_uri);

    if (!$scope.widget_uri)
    {
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
  }]);

voteApp.controller('adminConfigureInstanceSetSettingsItemCtl', ['$scope', 'VoteWidgetService', function($scope, VoteWidgetService) {
  // ask and remove the remaining criteria if there are more than 1
  $scope.confirmDeleteRemainingCriteria = function(max_size) {
    if ($scope.item.criteria.length > max_size && confirm('This item currently has more criteria than needed. Would you like to remove these remaining criteria?'))
    {
      $scope.item.criteria.splice(max_size, 999);
    }
  };

  $scope.enforceCorrectNumberOfCriteria = function(item_type_value) {
    // create the necessary amount of criterion fields, depending on the item type chosen, and the minimum of criterion they require
    $.each(VoteWidgetService.item_types, function(index, item_type) {
      if ('key' in item_type && item_type_value == item_type.key) {
        if ('number_of_criteria' in item_type) {
          //while ( $scope.item.criteria.length < item_type.number_of_criteria ){
          while ($scope.item.vote_specifications.length < item_type.number_of_criteria) {
            var criterion = {};
            VoteWidgetService.addDefaultFields(criterion, VoteWidgetService.mandatory_criterion_fields);

            //$scope.widget.settings.items[$scope.item_index].criteria.push(criterion);
            $scope.widget.settings.items[$scope.item_index].vote_specifications.push(criterion);
          }

          $scope.confirmDeleteRemainingCriteria(item_type.number_of_criteria);
        }
      }
    });
  };

  $scope.$watch('item.type', function(newValue, oldValue) {
    if (newValue != oldValue)
    {
      $scope.enforceCorrectNumberOfCriteria(newValue);
    }
  });
}]);

voteApp.controller('adminConfigureInstanceSetSettingsItemCriterionCtl', ['$scope', function($scope) {
  // pre-fill "name" field: if the user selects a criterion for a voting item (or sets the currently selected criterion to another one), set its "pretty" name to the criterion shortTitle
  $scope.$watch('criterion.entity_id', function(newValue, oldValue) {
    if (newValue != oldValue) // && !$scope.criterion.name
    {
      var criterionWithDetails = _.find($scope.criteria, function(criterion) {
        return criterion["@id"] == newValue;
      });
      if (criterionWithDetails && criterionWithDetails.shortTitle)
        $scope.criterion.name = criterionWithDetails.shortTitle;
    }
  });
}]);

voteApp.controller('votedCtl',
  ['$scope', '$http', '$routeParams', '$log', '$location', 'globalConfig', 'configTestingService', 'configService', 'Discussion',
  function($scope, $http, $routeParams, $log, $location, globalConfig, configTestingService, configService, Discussion) {

    $scope.init = function() {
    console.log("votedCtl::init()");

    $scope.settings = configService.settings;
    console.log("settings:");
    console.log($scope.settings);
  }

  }]);

voteApp.controller('resultsCtl',
  ['$scope', '$http', '$routeParams', '$log', '$location', 'globalConfig', 'configTestingService', 'configService', 'Discussion', 'AssemblToolsService', 'VoteWidgetService',
  function($scope, $http, $routeParams, $log, $location, globalConfig, configTestingService, configService, Discussion, AssemblToolsService, VoteWidgetService) {

    // intialization code (constructor)

    $scope.init = function() {
      console.log("resultsCtl::init()");

      console.log("configService:");
      console.log(configService);
      $scope.settings = configService.settings;
      console.log("settings 0:");
      console.log($scope.settings);

      // check that the user is logged in
      if (!configService.user || !configService.user.verified)
      {
        alert('You have to be authenticated to vote. Please log in and try again.');
        window.location.assign("/login");
        return;
      }

      $scope.user = configService.user;

      $scope.drawUI();
    };

    $scope.getVoteSpecFieldInSettings = function(vote_spec, field_name){
      if ( "settings" in vote_spec ){
        if( field_name in vote_spec.settings ){
          return vote_spec.settings[field_name];
        }
      }
      return null;
    };

    $scope.getVoteSpecByURI = function(uri){
      if ( "vote_specifications" in configService ){
        if ( configService.vote_specifications.length ){
          var sz = configService.vote_specifications.length;
          for ( var i = 0; i < sz; ++i ){
            var vote_spec = configService.vote_specifications[i];
            if ( "@id" in vote_spec && vote_spec["@id"] == uri ){
              return vote_spec;
            }
          }
        }
      }
      return null;
    };

    $scope.getVoteSpecLabelByURI = function(uri){
      var vote_spec = $scope.getVoteSpecByURI(uri);
      if ( vote_spec )
        return $scope.getVoteSpecFieldInSettings(vote_spec, "name");
      return null;
    };

    $scope.drawUI = function() {
      $scope.drawUIWithoutTable();
    };

    $scope.drawUIWithoutTable = function() {
      console.log("drawUIWithoutTable()");
      var widget = configService;
      var results_uris = "voting_results_by_spec_url" in widget ? widget.voting_results_by_spec_url : null;
      console.log("results_uris: ", results_uris);
      var results_urls = {};
      var results_promises = {};
      var questions = window.getUrlVariableValue("questions"); // A "question" is a vote_spec of a vote widget. Here we get a comma-separated list of vote_spec URIs
      if ( questions ){
        questions = questions.split(",");
      }
      console.log("questions: ", questions);
      var destination = d3.select("body");

      var result_received = function(vote_spec_uri){
        return function(vote_spec_result_data){
          console.log("promise " + vote_spec_uri + " resolved to: ", vote_spec_result_data);
          var filter_by_targets = null;
          $scope.drawVoteSpecificationResults(destination, vote_spec_uri, vote_spec_result_data, filter_by_targets);
        }
      };

      if ( results_uris ){
        for ( var spec_uri in results_uris ){
          results_urls[spec_uri] = AssemblToolsService.resourceToUrl(results_uris[spec_uri]) + "?histogram=10";
          if ( !questions || (questions.indexOf(spec_uri) != -1) ){
            results_promises[spec_uri] = $.ajax(results_urls[spec_uri]);
            $.when(results_promises[spec_uri]).done(result_received(spec_uri));
          }
        }
      }
      console.log("results_urls: ", results_urls);
      console.log("results_promises: ", results_promises);

      console.log("drawUIWithoutTable() completed");
    };

    $scope.drawVoteSpecificationResults = function(destination, vote_spec_uri, vote_spec_result_data, filter_by_targets){
      console.log("vote_spec_result_data: ", vote_spec_result_data);
      if ( vote_spec_result_data ){
        if ( $.isEmptyObject(vote_spec_result_data) ){ // there is no vote yet (on this vote_spec, on any of its available targets), but we have to show it instead of showing nothing
          if ( !filter_by_targets ){
            //$scope.drawVoteResult(destination, vote_spec_uri, {}, null);
            var vote_spec_label = $scope.getVoteSpecLabelByURI(vote_spec_uri) || vote_spec_uri;
            destination.append("p").html("There is no vote yet for question \"<span title='" + vote_spec_uri + "'>" + vote_spec_label + "\", on any of its target ideas.");
          }
        } else {
          for ( var target in vote_spec_result_data ){
            if ( !filter_by_targets || (filter_by_targets.indexOf(target) != -1) ){
              $scope.drawVoteResult(destination, vote_spec_uri, vote_spec_result_data[target], target);
            }
          }
        }
      }
    };

    /*
     * Bar chart is based on http://bl.ocks.org/Caged/6476579
     */
    $scope.drawVoteResult = function(destination, vote_spec_uri, vote_spec_result_data_for_target, target){
      console.log("drawing vote result for vote_spec_uri ", vote_spec_uri, " and target ", target, " which has data ", vote_spec_result_data_for_target);

      var vote_spec = $scope.getVoteSpecByURI(vote_spec_uri);
      var vote_spec_type = (vote_spec && "@type" in vote_spec) ? vote_spec["@type"] : "LickertVoteSpecification"; // can also be "MultipleChoiceVoteSpecification"

      var data = null;
      var result_number_of_voters = 0;
      if ( "n" in vote_spec_result_data_for_target )
        result_number_of_voters = vote_spec_result_data_for_target.n;

      if ( vote_spec_type == "BinaryVoteSpecification"){
        
        var labelYes = $scope.getVoteSpecFieldInSettings(vote_spec, "labelYes") || "Yes";
        var labelNo = $scope.getVoteSpecFieldInSettings(vote_spec, "labelNo") || "No";

        var votesYes = ("yes" in vote_spec_result_data_for_target) ? vote_spec_result_data_for_target.yes : 0;
        var votesNo = ("no" in vote_spec_result_data_for_target) ? vote_spec_result_data_for_target.no : 0;
        data = [
          {
            "label": labelYes,
            "votes": votesYes,
            "frequency": result_number_of_voters > 0 ? (votesYes / result_number_of_voters) : 0
          },
          {
            "label": labelNo,
            "votes": votesNo,
            "frequency": result_number_of_voters > 0 ? (votesNo / result_number_of_voters) : 0
          }
        ];
      }
      else if ( vote_spec_type == "MultipleChoiceVoteSpecification" ){

        data = [];

        var candidates = $scope.getVoteSpecFieldInSettings(vote_spec, "candidates");
        console.log("candidates: ", candidates);

        // first, create empty data (because vote results do not contain candidates which received zero vote)
        if ( candidates ){
          for ( var i = 0; i < candidates.length; ++i ){
            data.push({
              "label": candidates[i],
              "votes": 0,
              "frequency": 0
            });
          }
        }

        // then, fill data with vote results
        if ( "results" in vote_spec_result_data_for_target ){
          for ( var key in vote_spec_result_data_for_target.results ){
            console.log("key: ", key);
            console.log("parseInt(key): ", parseInt(key));
            console.log("candidates[parseInt(key)]: ", candidates[parseInt(key)]);
            var label = candidates ? candidates[parseInt(key)] : key;
            var votes = vote_spec_result_data_for_target.results[key];
            var frequency = result_number_of_voters > 0 ? (votes / result_number_of_voters) : 0;
            var data_item = _.findWhere(data, {"label": label});
            if ( data_item ){
              data_item.label = label;
              data_item.votes = votes;
              data_item.frequency = frequency;
            } else {
              data.push({
                "label": label,
                "votes": votes,
                "frequency": frequency
              });
            }
          }
        }

        console.log("final data: ", data);
      
      } else { // "LickertVoteSpecification"

        var result_average = null;
        if ( "avg" in vote_spec_result_data_for_target )
          result_average = vote_spec_result_data_for_target.avg;

        var result_standard_deviation = null;
        if ( "std_dev" in vote_spec_result_data_for_target )
          result_standard_deviation = vote_spec_result_data_for_target.std_dev;

        var result_histogram_data = [];
        var result_histogram = [];
        var lickert_value_min = 0;
        var lickert_value_max = 100;
        var lickert_value_cur = lickert_value_min;
        var histogram_size = null;
        var histogram_step = 10;

        if ( "histogram" in vote_spec_result_data_for_target ){
          result_histogram = vote_spec_result_data_for_target.histogram;
          
          histogram_size = result_histogram.length;
          console.log("histogram_size: ", histogram_size);
        }

        if ( histogram_size > 0 ){
          var histogram_step = (lickert_value_max - lickert_value_min) / histogram_size;
        } else {
          // create empty data to show to the user
          histogram_size = 10;
          for ( var i = 0; i < histogram_size; ++i )
            result_histogram.push(0);
          result_number_of_voters = 0;
        }
        console.log("result_histogram: ", result_histogram);

        result_histogram.forEach( function(number_of_voters_in_slice){
          var label = "" + lickert_value_cur + "-" + (lickert_value_cur+histogram_step);

          var frequency = 0;
          if (result_number_of_voters > 0)
            frequency = number_of_voters_in_slice / result_number_of_voters;

          result_histogram_data.push({
            "label": label,
            "votes": number_of_voters_in_slice,
            "frequency": frequency
          });

          lickert_value_cur += histogram_step;
        } );

        console.log("result_histogram_data: ", result_histogram_data);

        data = result_histogram_data;
      }


      var margin = {
        top: 40,
        right: 20,
        bottom: 30,
        left: 40
      };

      var width = 500 - margin.left - margin.right;
      var height = 300 - margin.top - margin.bottom;

      var formatPercent = d3.format(".0%");

      var x = d3.scale.ordinal()
        .rangeRoundBands([0, width], .1);

      var y = d3.scale.linear()
        .range([height, 0]);

      var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom");

      var yAxis = d3.svg.axis()
        .scale(y)
        .orient("left")
        .tickFormat(formatPercent);


      var tip = d3.tip()
        .attr('class', 'd3-tip')
        .offset([-10, 0])
        .html(function(d) {
          return "<strong>Frequency:</strong> <span style='color:red'>" + d.frequency + "</span>"
            + "<br/>" + "<strong>Votes:</strong> <span style='color:red'>" + d.votes + "</span>";
        });

      var vote_spec_label = $scope.getVoteSpecLabelByURI(vote_spec_uri) || vote_spec_uri;

      var target_idea_url = AssemblToolsService.resourceToUrl(target);
      var target_idea_promise = $.ajax(target_idea_url);
      var target_idea_label = target; // using target URI as label while waiting for its real label

      var result_info = destination.append("p");
      result_info.classed("result-info");
      var populateResultInfo = function(){
        var text = "Vote result for question \"<span title='" + vote_spec_uri + "'>" + vote_spec_label + "</span>\" and target idea \"<span title='" + target + "'>" + target_idea_label + "</span>\":";
        var text_number_of_votes = "number of votes: " + result_number_of_voters;
        if ( vote_spec_type == "MultipleChoiceVoteSpecification" || vote_spec_type == "BinaryVoteSpecification" ){
          // add only the number of votes
          text += "<br/>" + text_number_of_votes;
        } else {
          // add number of votes, average and standard deviation
          var text_average = "average: " + result_average;
          var text_standard_deviation = "standard deviation: " + result_standard_deviation;
          text += "<br/>" + text_number_of_votes + "<br/>" + text_average + "<br/>" + text_standard_deviation;
        }
        result_info.html(text);
      };    

      populateResultInfo();

      $.when(target_idea_promise).done(function(data){
        console.log("target_idea_promise data received: ", data);
        if ( "shortTitle" in data ){
          target_idea_label = data.shortTitle;
          populateResultInfo();          
        }
      });

      

      var svg = destination.append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
          .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      svg.call(tip);

      x.domain(data.map(function(d) { return d.label; }));
      y.domain([0, d3.max(data, function(d) { return d.frequency; })]);
      svg.append("g")
          .attr("class", "x axis")
          .attr("transform", "translate(0," + height + ")")
          .call(xAxis);
      svg.append("g")
          .attr("class", "y axis")
          .call(yAxis)
        .append("text")
          .attr("transform", "rotate(-90)")
          .attr("y", 6)
          .attr("dy", ".71em")
          .style("text-anchor", "end")
          .text("Frequency");

      svg.selectAll(".bar")
        .data(data)
        .enter()
        .append("rect")
          .attr("class", "bar")
          .attr("x", function(d) { return x(d.label); })
          .attr("width", x.rangeBand())
          .attr("y", function(d) { return y(d.frequency); })
          .attr("height", function(d) { return height - y(d.frequency); })
          .on('mouseover', tip.show)
          .on('mouseout', tip.hide);
    };

  }]);

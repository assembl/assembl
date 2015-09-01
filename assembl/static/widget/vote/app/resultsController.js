"use strict";

voteApp.controller('resultsCtl',
  ['$scope', '$http', '$routeParams', '$log', '$location', '$translate', 'globalConfig', 'configTestingService', 'configService', 'AssemblToolsService', 'VoteWidgetService',
  function($scope, $http, $routeParams, $log, $location, $translate, globalConfig, configTestingService, configService, AssemblToolsService, VoteWidgetService) {

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
        $translate('errorNeedLogin').then(function(translation) {
          alert(translation);
          window.location.assign("/login");
        });
        return;
      }

      $scope.user = configService.user;

      $scope.initForAllTargets();
    };

    $scope.initForAllTargets = function(){
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
        $scope.targets_ids.forEach(function(target, targetIndex){
          var promise_generator = function(){
            return $.ajax(AssemblToolsService.resourceToUrl(target));
          };
          $scope.targets_promises[target] = $scope.afterDelayPromiseGenerator(targetIndex*300, promise_generator);
        });
      }

      $scope.drawUI();

    };

    $scope.delayPromiseGenerator = function(time) {
      var defer = new $.Deferred();
      setTimeout(function () {
        defer.resolve();
      }, time);
      return defer.promise();
    };

    $scope.afterDelayPromiseGenerator = function(time, promise_generator){
      var defer = new $.Deferred();
      var delayPromise = $scope.delayPromiseGenerator(time);
      delayPromise.then(function(){
        var executedPromise = promise_generator();
        executedPromise.then(defer.resolve, defer.reject);
      }, defer.reject);
      return defer.promise();
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
      var settings = "settings" in widget ? widget.settings : null;
      var items = "items" in settings ? settings.items : null;

      var questions = window.getUrlVariableValue("questions"); // A "question" is a vote_spec of a vote widget. Here we get a comma-separated list of vote_spec URIs
      if ( questions ){
        questions = questions.split(",");
      }
      console.log("questions: ", questions);

      var results_uris = "voting_results_by_spec_url" in widget ? widget.voting_results_by_spec_url : null;
      console.log("results_uris: ", results_uris);
      var results_urls = {};
      var results_promises = {};
      
      var destination = d3.select("body");
      var destination_jquery = $("body");

      // @param destination_for_this_result: d3 selector
      var single_vote_spec_result_received = function(vote_spec_uri, destination_for_this_result){
        return function(vote_spec_result_data){
          var filter_by_targets = $scope.targets_ids;
          $scope.drawResultsForAllTargetsOfVoteSpecification(destination_for_this_result, vote_spec_uri, vote_spec_result_data, filter_by_targets);
        }
      };

      var grouped_vote_spec_results_received = function(vote_spec_uris, destination_for_this_result){
        return function(vote_spec_result_data){
          var filter_by_targets = $scope.targets_ids;
          $scope.drawResultsForAllTargetsOfTwoCombinedVoteSpecifications(destination_for_this_result, vote_spec_uris[0], vote_spec_uris[1], vote_spec_result_data, filter_by_targets);
        }
      };

      // iterate on all items and display vote results in this order
      if ( items && items.length ){
        items.forEach(function(item, item_index){
          var item_vote_specifications = "vote_specifications" in item ? item.vote_specifications : null;
          var item_type = "type" in item ? item.type : null;

          // add a <section> for the question

          var question_holder = $("<section class='vote-question-item' />");
          if ( item_type == "radio" || item_type == "vertical_gauge" || item_type == "2_axes" ){
            question_holder.addClass("vote-question-item-type-"+item_type);
          }
          question_holder.attr("id", "vote-question-item-"+item_index);
          destination_jquery.append(question_holder);
          var question_holder_d3 = d3.select(question_holder.get(0));


          // show question title and description

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


          if ( item_vote_specifications && item_vote_specifications.length ){
            if ( item_type != "2_axes" && item_vote_specifications.length == 1 ){ // this is a single criterion item/question, so we show its results as a bar chart
              var vote_spec = item_vote_specifications[0];
              var vote_spec_id = "@id" in vote_spec ? vote_spec["@id"] : null;
              if ( vote_spec_id ){
                results_urls[vote_spec_id] = AssemblToolsService.resourceToUrl(results_uris[vote_spec_id]) + "?histogram=10"; // TODO: this could be a customizable URL parameter
                if ( !questions || (questions.indexOf(vote_spec_id) != -1) ){
                  results_promises[vote_spec_id] = $.ajax(results_urls[vote_spec_id]);
                  var destination_for_this_result = question_holder_d3.append("div");
                  $.when(results_promises[vote_spec_id]).done(single_vote_spec_result_received(vote_spec_id, destination_for_this_result));
                }
              }
            } else if ( item_type == "2_axes" && item_vote_specifications.length == 2 ){ // this is a 2_axes item, so we show its results as a heatmap
              var vote_spec_id = null;
              var first = true;
              var second_vote_spec_id = "@id" in item_vote_specifications[1] ? item_vote_specifications[1]["@id"] : null;
              item_vote_specifications.forEach(function(vote_spec){
                vote_spec_id = "@id" in vote_spec ? vote_spec["@id"] : null;
                if ( vote_spec_id ){
                  results_urls[vote_spec_id] = AssemblToolsService.resourceToUrl(results_uris[vote_spec_id]) + "?histogram=10"; // TODO: this could be a customizable URL parameter
                  if ( !questions || (questions.indexOf(vote_spec_id) != -1) ){
                    results_promises[vote_spec_id] = $.ajax(results_urls[vote_spec_id]);
                    if ( first ){
                      first = false;
                      // each vote_spec which shares a question_id property with other vote_specs contains all single and grouped vote results
                      var destination_for_this_result = question_holder_d3.append("div");
                      $.when(results_promises[vote_spec_id]).done(grouped_vote_spec_results_received([vote_spec_id, second_vote_spec_id], destination_for_this_result));
                    }
                  }
                }
              });
            }
          }
        });
      }

      console.log("results_urls: ", results_urls);
      console.log("results_promises: ", results_promises);

      console.log("drawUIWithoutTable() completed");
    };

    $scope.drawResultsForAllTargetsOfTwoCombinedVoteSpecifications = function(destination, x_vote_spec_uri, y_vote_spec_uri, vote_specs_result_data, filter_by_targets){

      var drawTargetTitleAndItem = function(destination, first_vote_spec_uri, second_vote_spec_uri, vote_spec_result_data, target_id){
        var inline_vote_holder = destination.append("div");
        inline_vote_holder.classed({"inline-vote-result-for-a-target": true});
        
        $scope.drawTargetTitleHolder(inline_vote_holder, target_id);
        var item_holder = inline_vote_holder.append("div");
        item_holder.classed({"inline-vote-result-for-a-target--item": true});
        $scope.drawResultAsHeatmapForSingleTargetOfTwoVoteSpecifications(item_holder, first_vote_spec_uri, second_vote_spec_uri, vote_spec_result_data, target_id);
      };


      if ( vote_specs_result_data ){
        if ( $.isEmptyObject(vote_specs_result_data) ){ // there is no vote yet (on this vote_spec, on any of its available targets), but we have to show it instead of showing nothing
          if ( !filter_by_targets ){
            //$scope.drawResultAsBarChartForSingleTargetOfVoteSpecification(destination, vote_spec_uri, {}, null);
            var vote_spec_label = $scope.getVoteSpecLabelByURI(vote_spec_uri) || vote_spec_uri;
            $translate('voteResultsForQuestionNoResult', {"hover": vote_spec_uri, "label": vote_spec_label}).then(function(translation) {
              destination.append("p").html(translation);
            });
          }
        } else {
          var data = null;
          // we will find the bigger group of vote specifications => the one which has the most of commas in its key
          var max_number_of_commas = 0;
          var best_key = null;
          var count_number_of_commas = function(str){
            return (str.match(/,/g) || []).length;
          };
          for ( var vote_spec_list_key in vote_specs_result_data ){ // vote_spec_list_key is a vote specification id, or several ones delimited by a comma
            var current_number_of_commas = count_number_of_commas(vote_spec_list_key);
            if ( current_number_of_commas > max_number_of_commas ){
              max_number_of_commas = current_number_of_commas;
              best_key = vote_spec_list_key;
            }
          }
          if ( best_key ){
            data = vote_specs_result_data[best_key];
            if ( !( best_key.indexOf(x_vote_spec_uri) != -1 && best_key.indexOf(y_vote_spec_uri) != -1 ) ){
              console.log("ALERT: key ", best_key, " does not contain both of the criteria we were looking for: ", x_vote_spec_uri, y_vote_spec_uri );
              // should we still display these heatmaps?
            }
            // TODO: i'm not sure the order of vote_specs is kept
            var first_vote_spec_uri = best_key.split(",")[0];
            var second_vote_spec_uri = best_key.split(",")[1];
            for ( var target in data ){
              if ( !filter_by_targets || (filter_by_targets.indexOf(target) != -1) ){
                drawTargetTitleAndItem(destination, first_vote_spec_uri, second_vote_spec_uri, data[target], target);
              }
            }
          }
        }
      }
    };

    /*
     * Heatmap is based on http://bl.ocks.org/mbostock/3202354
     */
    $scope.drawResultAsHeatmapForSingleTargetOfTwoVoteSpecifications = function(destination, x_vote_spec_uri, y_vote_spec_uri, vote_spec_result_data_for_target, target){

      var x_vote_spec = $scope.getVoteSpecByURI(x_vote_spec_uri);
      var y_vote_spec = $scope.getVoteSpecByURI(y_vote_spec_uri);
      var x_vote_spec_type = (x_vote_spec && "@type" in x_vote_spec) ? x_vote_spec["@type"] : "LickertVoteSpecification";
      if ( x_vote_spec_type != "LickertVoteSpecification" ){
        console.log("ERROR: x_vote_spec_type is not of type LickertVoteSpecification. Instead: ", x_vote_spec_type);
      }
      var y_vote_spec_type = (y_vote_spec && "@type" in y_vote_spec) ? y_vote_spec["@type"] : "LickertVoteSpecification";
      if ( y_vote_spec_type != "LickertVoteSpecification" ){
        console.log("ERROR: y_vote_spec_type is not of type LickertVoteSpecification. Instead: ", y_vote_spec_type);
      }

      var x_vote_spec_label = $scope.getVoteSpecLabelByURI(x_vote_spec_uri) || x_vote_spec_uri;
      var y_vote_spec_label = $scope.getVoteSpecLabelByURI(y_vote_spec_uri) || y_vote_spec_uri;

      var data = [];
      var result_number_of_voters = 0;
      if ( "n" in vote_spec_result_data_for_target )
        result_number_of_voters = vote_spec_result_data_for_target.n;

      var result_heatmap_data = [];
      var result_histogram = [];
      var heatmap_y_size = null;
      var heatmap_x_size = null;
      var heatmap_y_step = 10;
      var heatmap_x_step = 10;
      var lickert_y_min_value = "minimum" in y_vote_spec ? y_vote_spec.minimum : 0;
      var lickert_x_min_value = "minimum" in x_vote_spec ? x_vote_spec.minimum : 0;
      var lickert_y_max_value = "maximum" in y_vote_spec ? y_vote_spec.maximum : 100;
      var lickert_x_max_value = "maximum" in x_vote_spec ? x_vote_spec.maximum : 100;

      if ( "histogram" in vote_spec_result_data_for_target ){
        result_histogram = vote_spec_result_data_for_target.histogram;
        
        heatmap_y_size = result_histogram.length;
      }

      if ( heatmap_y_size > 0 ){
        heatmap_y_step = (lickert_y_max_value - lickert_y_min_value) / heatmap_y_size;
        heatmap_x_size = result_histogram[0].length;
        if ( heatmap_x_size > 0 ){
          heatmap_x_step = (lickert_x_max_value - lickert_x_min_value) / heatmap_x_size;
        } else {
          heatmap_x_step = 10;
        }
      } else {
        // create empty data to show to the user
        heatmap_y_size = 10;
        heatmap_x_size = 10;
        for ( var y = 0; y < heatmap_y_size; ++y ){
          result_histogram[y] = [];
          for ( var x = 0; x < heatmap_x_size; ++x ){
            result_histogram[y][x] = 0;
          }
        }
        result_number_of_voters = 0;
      }


      var current_y_step = lickert_y_min_value;
      result_histogram.forEach(function(row, row_index){
        var current_x_step = lickert_x_min_value;
        row.forEach(function(element, element_index){
          var frequency = 0;
          if ( result_number_of_voters > 0 ){
            frequency = element / result_number_of_voters;
          }
          result_heatmap_data.push({
            "y_bucket": current_y_step,
            "x_bucket": current_x_step,
            "votes": element,
            "frequency": frequency
          });
          current_x_step += heatmap_x_step;
        });
        current_y_step += heatmap_y_step;
      });

      data = result_heatmap_data;

      var destination_for_this_result = destination; //destination.append("div");
      //destination_for_this_result.classed({"inline-vote-result-for-a-target": true});


      $translate('voteResultsForTwoCriteria', {"first_hover": x_vote_spec_uri, "first_label": x_vote_spec_label, "second_hover": y_vote_spec_uri, "second_label": y_vote_spec_label, "number_of_votes": result_number_of_voters}).then(function(translation) {
        destination_for_this_result.append("p").html(translation);
      });


      var chart_holder = destination_for_this_result.append("div");
      chart_holder.classed({"heatmap": true});





      var margin = {top: 10, right: 90, bottom: 30, left: 40},
          width = 400,
          height = 400;

      var parseDate = d3.time.format("%Y-%m-%d").parse,
          formatDate = d3.time.format("%b %d");

      // var x = d3.time.scale().range([0, width]);
      var x = d3.scale.linear().range([0, width]);
      var y = d3.scale.linear().range([height, 0]);
      //var z = d3.scale.linear().range(["white", "steelblue"]);
      var z = d3.scale.linear().range(["white", "#9013FE"]);

      // The size of the buckets in the CSV data file.
      // This could be inferred from the data if it weren't sparse.
      var xStep = heatmap_x_step; // was 864e5,
      var yStep = heatmap_y_step; // was 100;

      var svg = chart_holder.append("svg")
          .attr("width", width + margin.left + margin.right)
          .attr("height", height + margin.top + margin.bottom)
        .append("g")
          .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        // Coerce the CSV data to the appropriate types.
        data.forEach(function(d) {
          //d.date = parseDate(d.date);
          d.y_bucket = +d.y_bucket;
          d.x_bucket = +d.x_bucket;
          d.votes = +d.votes;
          d.frequency = +d.frequency;
        });

        // Compute the scale domains.
        x.domain(d3.extent(data, function(d) { return d.x_bucket; }));
        y.domain(d3.extent(data, function(d) { return d.y_bucket; }));
        z.domain([0, d3.max(data, function(d) { return d.votes; })]);

        // Extend the x- and y-domain to fit the last bucket.
        // For example, the y-bucket 3200 corresponds to values [3200, 3300].
        x.domain([x.domain()[0], +x.domain()[1] + xStep]);
        y.domain([y.domain()[0], y.domain()[1] + yStep]);

        // Display the tiles for each non-zero bucket.
        // See http://bl.ocks.org/3074470 for an alternative implementation.
        svg.selectAll(".tile")
            .data(data)
          .enter().append("rect")
            .attr("class", "tile")
            .attr("x", function(d) { return x(d.x_bucket); })
            .attr("y", function(d) { return y(d.y_bucket + yStep); })
            .attr("width", x(xStep) - x(0))
            .attr("height",  y(0) - y(yStep))
            .style("fill", function(d) { return z(d.votes); });

        // Add a legend for the color values.
        var legend = svg.selectAll(".legend")
            .data(z.ticks(6).slice(1).reverse())
          .enter().append("g")
            .attr("class", "legend")
            .attr("transform", function(d, i) { return "translate(" + (width + 20) + "," + (20 + i * 20) + ")"; });

        legend.append("rect")
            .attr("width", 20)
            .attr("height", 20)
            .style("fill", z);

        legend.append("text")
            .attr("x", 26)
            .attr("y", 10)
            .attr("dy", ".35em")
            .text(String);

        svg.append("text")
            .attr("class", "label")
            .attr("x", width + 20)
            .attr("y", 10)
            .attr("dy", ".35em")
            .text("Count"); // TODO: i18n

        // Add an x-axis with label.
        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.svg.axis().scale(x).orient("bottom")) // was .call(d3.svg.axis().scale(x).ticks(d3.time.days).tickFormat(formatDate).orient("bottom"))
          .append("text")
            .attr("class", "label")
            .attr("x", width)
            .attr("y", -6)
            .attr("text-anchor", "end")
            .text(x_vote_spec_label);

        // Add a y-axis with label.
        svg.append("g")
            .attr("class", "y axis")
            .call(d3.svg.axis().scale(y).orient("left"))
          .append("text")
            .attr("class", "label")
            .attr("y", 6)
            .attr("dy", ".71em")
            .attr("text-anchor", "end")
            .attr("transform", "rotate(-90)")
            .text(y_vote_spec_label);
    };

    $scope.drawTargetTitleHolder = function(destination, target_id){
      var strResultsForIdea = "Results for idea";
      $translate('voteResultsForTarget').then(function(translation) {
        strResultsForIdea = translation;
      });
      var getShownText = function(title){
        var shown_text = strResultsForIdea + " \"" + title + "\"";
        return shown_text;
      }

      var target_title_holder = destination.append("div");
      target_title_holder.classed({"inline-vote-result-for-a-target--title": true});
      target_title_holder.text(getShownText(target_id));
      target_title_holder.attr("data-target-id", target_id);
      if ( target_id in $scope.targets_promises ){
        $.when($scope.targets_promises[target_id]).done(function(data){
          if ( "shortTitle" in data ){
            target_title_holder.text(getShownText(data.shortTitle));
            if ( "definition" in data && data.definition.length ){
              target_title_holder.attr("title", data.definition); // TODO: but this is HTML :/
              //for debug: target_title_holder.attr("title", target_id);
            }
          } else {
            console.log("error: idea ", target_id, "has no shortTitle property");
          }
        });
      }
    };

    // @param destination: d3 selector
    $scope.drawResultsForAllTargetsOfVoteSpecification = function(destination, vote_spec_uri, vote_spec_result_data, filter_by_targets){

      var drawTargetTitleAndItem = function(destination, vote_spec_uri, vote_spec_result_data, target_id){
        var inline_vote_holder = destination.append("div");
        inline_vote_holder.classed({"inline-vote-result-for-a-target": true});
        
        $scope.drawTargetTitleHolder(inline_vote_holder, target_id);
        var item_holder = inline_vote_holder.append("div");
        item_holder.classed({"inline-vote-result-for-a-target--item": true});
        $scope.drawResultAsBarChartForSingleTargetOfVoteSpecification(item_holder, vote_spec_uri, vote_spec_result_data, target_id);
      };

      if ( vote_spec_result_data ){
        if ( $.isEmptyObject(vote_spec_result_data) ){ // there is no vote yet (on this vote_spec, on any of its available targets), but we have to show it instead of showing nothing
          if ( !filter_by_targets ){
            //$scope.drawResultAsBarChartForSingleTargetOfVoteSpecification(destination, vote_spec_uri, {}, null);
            var vote_spec_label = $scope.getVoteSpecLabelByURI(vote_spec_uri) || vote_spec_uri;
            $translate('voteResultsForQuestionNoResult', {"hover": vote_spec_uri, "label": vote_spec_label}).then(function(translation) {
              destination.append("p").html(translation);
            });
          }
        } else {
          for ( var target in vote_spec_result_data ){
            if ( target.indexOf("local:AbstractVoteSpecification/") == 0 ){ // this means instead of having target ideas as keys, the backed first gives us the AbstractVoteSpecification id, so we have to iterate one more depth level
              if ( target == vote_spec_uri ){ // here we care only about current vote_spec_uri
                for ( var target_real in vote_spec_result_data[target] ){
                  if ( !filter_by_targets || (filter_by_targets.indexOf(target_real) != -1) ){
                    drawTargetTitleAndItem(destination, vote_spec_uri, vote_spec_result_data[target][target_real], target_real);
                  }
                }
              }
            }
            else {
              if ( !filter_by_targets || (filter_by_targets.indexOf(target) != -1) ){
                drawTargetTitleAndItem(destination, vote_spec_uri, vote_spec_result_data[target], target);
              }
            }
          }
        }
      }
    };

    /*
     * Bar chart is based on http://bl.ocks.org/Caged/6476579
     */
    $scope.drawResultAsBarChartForSingleTargetOfVoteSpecification = function(destination, vote_spec_uri, vote_spec_result_data_for_target, target){

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
      
      } else { // "LickertVoteSpecification"

        var result_average = null;
        if ( "avg" in vote_spec_result_data_for_target )
          result_average = vote_spec_result_data_for_target.avg;

        var result_standard_deviation = null;
        if ( "std_dev" in vote_spec_result_data_for_target )
          result_standard_deviation = vote_spec_result_data_for_target.std_dev;

        var result_histogram_data = [];
        var result_histogram = [];
        var lickert_value_min = "minimum" in vote_spec ? +vote_spec.minimum : 0;
        var lickert_value_max = "maximum" in vote_spec ? +vote_spec.maximum : 100;
        var lickert_value_cur = lickert_value_min;
        var histogram_size = null;
        var histogram_step = 10;

        if ( "histogram" in vote_spec_result_data_for_target ){
          result_histogram = vote_spec_result_data_for_target.histogram;
          
          histogram_size = result_histogram.length;
        }

        if ( histogram_size > 0 ){
          histogram_step = (lickert_value_max - lickert_value_min) / histogram_size;
        } else {
          // create empty data to show to the user
          histogram_size = 10;
          for ( var i = 0; i < histogram_size; ++i )
            result_histogram.push(0);
          result_number_of_voters = 0;
        }

        result_histogram.forEach( function(number_of_voters_in_slice){
          var label = "" + lickert_value_cur.toFixed(0) + "-" + (lickert_value_cur+histogram_step).toFixed(0); // temporary

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

        data = result_histogram_data;
      }


      var margin = {
        top: 10,
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

      var strTooltipContentVotes = "Votes:";
      var strTooltipContentFrequency = "Frequency:";
      $translate('voteResultsVotes').then(function(translation) {
        strTooltipContentVotes = translation;
      });
      $translate('voteResultsFrequency').then(function(translation) {
        strTooltipContentFrequency = translation;
      });
      var strItemContentVotes = strTooltipContentVotes; // could be a different i18n
      var strItemContentAverage = "Average:";
      var strItemContentStandardDeviation = "Standard deviation:";
      $translate('voteResultsAverage').then(function(translation) {
        strItemContentAverage = translation;
      });
      $translate('voteResultsStandardDeviation').then(function(translation) {
        strItemContentStandardDeviation = translation;
      });



      var tip = d3.tip()
        .attr('class', 'd3-tip')
        .offset([-10, 0])
        .html(function(d) {
          return "<strong>"+strTooltipContentFrequency+"</strong> <span style='color:red'>" + d.frequency + "</span>"
            + "<br/>" + "<strong>"+strTooltipContentVotes+"</strong> <span style='color:red'>" + d.votes + "</span>";
        });

      var vote_spec_label = $scope.getVoteSpecLabelByURI(vote_spec_uri) || vote_spec_uri;

      var target_idea_label = target; // using target URI as label while waiting for its real label
      var target_idea_definition = null;

      var result_info = destination.append("p");
      result_info.classed("result-info");
      var populateResultInfo = function(){
        // var text = "Vote result for question \"<span title='" + vote_spec_uri + "'>" + vote_spec_label + "</span>\" and target idea \"<span title='" + target + "'>" + target_idea_label + "</span>\":";
        //var text = "Result on the idea \"<span title='" + (target_idea_definition || target) + "'>" + target_idea_label + "</span>\":";
        var text = "";
        var text_number_of_votes = strItemContentVotes + " " + result_number_of_voters;
        if ( vote_spec_type == "MultipleChoiceVoteSpecification" || vote_spec_type == "BinaryVoteSpecification" ){
          // add only the number of votes
          text += text_number_of_votes;
        } else {
          // add number of votes, average and standard deviation
          var text_average = strItemContentAverage + " " + result_average;
          var text_standard_deviation = strItemContentStandardDeviation + " " + result_standard_deviation;
          text += text_number_of_votes + "<br/>" + text_average + "<br/>" + text_standard_deviation;
        }
        result_info.html(text);
      };    

      populateResultInfo();

      var target_id = target;
      if ( target_id in $scope.targets_promises ){
        $.when($scope.targets_promises[target_id]).done(function(data){
          if ( "shortTitle" in data ){
            target_idea_label = data.shortTitle;
            if ( "definition" in data && data.definition.length ){
              target_idea_definition = data.definition; // TODO: but this is HTML :/
            }
            populateResultInfo();
          } else {
            console.log("error: idea ", target_id, "has no shortTitle property");
          }
        });
      }

      

      var svg = destination.append("svg")
        .classed({"barchart": true})
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
          .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      svg.call(tip);

      x.domain(data.map(function(d) { return d.label; }));
      y.domain([0, d3.max(data, function(d) { return d.frequency; })]);


      var strItemAxisFrequency = "Frequency";

      svg.append("g")
          .attr("class", "x axis")
          .attr("transform", "translate(0," + height + ")")
          .call(xAxis);
      var y_axis = svg.append("g")
          .attr("class", "y axis")
          .call(yAxis);
      var y_axis_label = y_axis.append("text")
          .attr("transform", "rotate(-90)")
          .attr("y", 6)
          .attr("dy", ".71em")
          .style("text-anchor", "end")
          .text(strItemAxisFrequency);

      $translate('voteResultsAxisFrequency').then(function(translation) {
        strItemAxisFrequency = translation;
        y_axis_label.text(strItemAxisFrequency);
      });

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

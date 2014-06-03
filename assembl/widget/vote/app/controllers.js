"use strict";

voteApp.controller('indexCtl',
  ['$scope', '$http', '$routeParams', '$log', 'globalConfig', 'configTestingService', 'configService', 'Discussion',
  function($scope, $http, $routeParams, $log, globalConfig, configTestingService, configService, Discussion){

    // intialization code (constructor)

    $scope.init = function(){
      console.log("indexCtl::init()");

      $scope.settings = configService.settings;
      console.log("settings:");
      console.log($scope.settings);


      // check that the user is logged in
      if ( !configService.user || !configService.user.verified )
      {
        alert('You have to be authenticated to vote. Please log in and try again.');
        window.location.assign("/login");
        return;
      }

      // TODO (when the API is implemented): check that the user has the right to participate in this vote


      // check that an URL to POST the vote is provided in the configuration JSON
      if ( configService.user_votes_uri && configService.user_votes_uri != "null" )
      {
        $scope.postVoteUrl = configService.user_votes_uri;
        var start = "local:";
        if ( $scope.postVoteUrl.indexOf(start) == 0 )
        {
          $scope.postVoteUrl = "/data/" + $scope.postVoteUrl.slice(start.length);
        }
        console.log("postVoteUrl:");
        console.log($scope.postVoteUrl);
      }
      else
      {
        // TODO: better error
        alert("Error: The configuration JSON does not contain a \"user_votes_uri\" property.");
        return;
      }
      

      $scope.drawUI();
      $scope.computeMyVotes();
    };

    $scope.computeMyVotes = function(){
      $scope.myVotes = [];

      $("#d3_container g.criterion").each(function(index) {
        // do not use .data("criterion-value") because jQuery does not seem to read the value set by d3
        $scope.myVotes[index] = {
          'id': $(this).attr("data-criterion-id"),
          'value': $(this).attr("data-criterion-value")
        };
      });

      return $scope.myVotes;
    };

    $scope.submitVote = function(){
      $scope.computeMyVotes();
      console.log($scope.myVotes);
      // TODO: POST to postVoteUrl if set
    };

    // @param destination
    // The d3 container (div)
    // @param item_data
    // One of the elements of the "items" array, from the configuration JSON
    // @param xPosCenter
    // Position on the X coordinates of the center of the gauge, in the created SVG
    $scope.drawVerticalGauge = function(destination, item_data, xPosCenter){
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
        .attr("data-criterion-id", criterion.id)
        .attr("data-criterion-value", criterionValue);


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
      g.append("text")
        .attr("y", item_data.height - config.padding*0.3 )
        .attr("x", xPosCenter )
        .style("text-anchor", "middle")
        .text(criterion.name);

      

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
        .attr("data-criterion-id", criteria[0].id)
        .attr("data-criterion-value", criterionXValue)
        .attr("data-criterion-type", "x");

      svg.append("g")
        .attr("class", "criterion")
        .attr("data-criterion-id", criteria[1].id)
        .attr("data-criterion-value", criterionYValue)
        .attr("data-criterion-type", "y");


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
      g.append("text")
        //.attr("transform", "translate(" + (width / 2) + " ," + (height + margin.bottom) + ")")
        .attr("y", (item_data.height - config.padding/2) )
        .attr("x", (item_data.width / 2) )
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text(criteria[0].name);

      // show Y axis label
      g.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", (0) )
        .attr("x", (0 - item_data.height/2) )
        .attr("dy", config.padding/3 + "px")
        .attr("dx", "-2em") // reposition center to integrate text length
        .style("text-anchor", "middle")
        .text(criteria[1].name);

      
        /* TODO
      // show descriptions of the minimum and maximum values
      if ( criterion.descriptionMin )
      {
        g.append("text")
          .attr("y", config.height - config.padding*0.7 )
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
      */

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



    $scope.drawUI = function(){
      var config = $scope.settings;
      var holder = d3.select("#d3_container");

      for ( var i = 0; i < config.items.length; ++i )
      {
        var item = config.items[i];
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

    };

}]);

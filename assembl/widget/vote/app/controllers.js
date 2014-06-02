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
    }

    $scope.submitVote = function(){
      $scope.computeMyVotes();
      console.log($scope.myVotes);
    }

    // @param destination
    // The d3 container (div)
    // @param xPosCenter
    // Position on the X coordinates of the center of the gauge, in the container
    // @param item_data
    // One of the elements of the "items" array, from the configuration JSON
    $scope.drawVerticalGauge = function(destination, xPosCenter, item_data){
      //console.log("item_data:");
      //console.log(item_data);
      var config = $scope.settings;
      var criterion = item_data.criteria[0];//item_data[0];
      var criterionValue = (criterion.valueDefault || criterion.valueDefault === 0.0) ? criterion.valueDefault : criterion.valueMin;

      // create the graph
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
        .range([config.height - config.padding, config.padding])
        .clamp(true);

      var ticks = 5;
      if ( criterion.ticks )
        ticks = criterion.ticks;
      var axis = d3.svg.axis()
        .scale(scale)
        .orient("left")
        .ticks(ticks);


      function dragmove(d) {
        var x = d3.event.x;
        var y = d3.event.y;

        var v = scale.invert(y);

        svg.select("g.criterion").attr("data-criterion-value", v);

        svg.select("circle").attr("cy", scale(v));
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

        var v = scale.invert(p.y);

        svg.select("g.criterion").attr("data-criterion-value", v);

        svg.select("circle").attr("cy", scale(v));
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
          .attr("y", config.padding-1 )
          //.attr("y", scales[i](config.axes[i].valueMax) )
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
        .attr("y", config.height - config.padding*0.3 )
        .attr("x", xPosCenter )
        .style("text-anchor", "middle")
        .text(criterion.name);

      

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

      // draw the cursor
      svg.append("circle")
        //.attr("id", function(d, i){ return "circle"+i; })
        .attr("cx", xPosCenter)
        .attr("cy", scale(criterionValue) )
        .attr("r", 8)
        .style("fill", ( criterion.colorCursor ) ? criterion.colorCursor : "blue")
        .style("cursor", "pointer")
        ;
        //.call(drag);


    }

    $scope.drawUI = function(){
      var config = $scope.settings;
      var holder = d3.select("#d3_container");

      for ( var i = 0; i < config.items.length; ++i )
      {
        var item = config.items[i];
        console.log("item.type:");
        console.log(item.type);
        if ( item.type == "vertical_gauge" )
        {
          $scope.drawVerticalGauge(holder, 100, item);
        }
        else if ( item.type == "2_axes" )
        {
          // TODO
          // $scope.drawVerticalGauge(destination, xPosCenter, item_data);
        }
      }

    };

}]);

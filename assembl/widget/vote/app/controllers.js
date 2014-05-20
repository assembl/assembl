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

      // init vote value
      $scope.vote = [];
      for ( var i = 0; i < $scope.settings.axes.length; ++i )
      {
        var v = ($scope.settings.axes[i].valueDefault || $scope.settings.axes[i].valueDefault === 0.0)
          ? $scope.settings.axes[i].valueDefault : $scope.settings.axes[i].valueMin;
        $scope.vote.push({ "name": $scope.settings.axes[i].name, "value": v});
      }

      $scope.drawUI();
    };

    $scope.submitVote = function(){
      console.log($scope.vote);
    }

    $scope.drawUI = function(){
      var config = $scope.settings;


      var holder;

      function getSelectorIndexByX(x)
      {
        // find the nearest selector, but return -1 if the position clicked is too far
        var inv = xScale.invert(x);
        if ( (inv % 1.0) < 0.6 && (inv % 1.0) > 0.4 )
          return -1;
        return Math.round(xScale.invert(x));
      }

      function click()
      {
        // Ignore the click event if it was suppressed
        if (d3.event.defaultPrevented) return;

        // Extract the click location
        var point = d3.mouse(this);
        var p = {x: point[0], y: point[1] };

        // find on which slider the user is clicking

        var indexSelector = getSelectorIndexByX(p.x);

        if ( indexSelector >= 0 && indexSelector < config.axes.length )
        {
          var v = scales[indexSelector].invert(p.y);
          $scope.vote[indexSelector].value = v;
          d3.select("#circle"+indexSelector).attr("cy", scales[indexSelector](v));
        }
      }

      function dragmove(d) {
        var x = d3.event.x;
        var y = d3.event.y;

        var indexSelector = getSelectorIndexByX(x);

        if ( indexSelector >= 0 && indexSelector < config.axes.length )
        {
          var v = scales[indexSelector].invert(y);
          $scope.vote[indexSelector].value = v;
          d3.select(this).attr("cy", scales[indexSelector](v));
        }
          
      }

      // create scales

      var scales = [];
      var axes = [];
      for ( var i = 0; i < config.axes.length; ++i )
      {
        // vertical scales
        var scale = d3.scale.linear()
          .domain([config.axes[i].valueMin, config.axes[i].valueMax])
          .range([config.height - config.padding, config.padding])
          .clamp(true);
        scales.push(scale);

        var ticks = 5;
        if ( config.axes[i].ticks )
          ticks = config.axes[i].ticks;
        var axis = d3.svg.axis()
          .scale(scale)
          .orient("left")
          .ticks(ticks);
        axes.push(axis);
      }

      var xScale = d3.scale.linear()
        .domain([0, config.axes.length])
        .range([config.padding, config.width - config.padding])
        .clamp(true);


      // create (hidden) X axis using its scale
      var xAxis = d3.svg.axis()
        .scale(xScale)
        .orient("bottom");

      // define drag beavior
      var drag = d3.behavior.drag()
        .on("drag", dragmove);

      // create the graph
      var holder = d3.select("#d3_container")
        .append("svg")
        .attr("width", config.width)    
        .attr("height", config.height)
        .on("click", click);

      var svg = d3.select("#d3_container svg");


      // show vertical axes, their label, and their gradient
      for ( var i = 0; i < config.axes.length; ++i )
      {
        if ( config.axes[i].colorMin && config.axes[i].colorMax )
        {
          // define a gradient in the SVG (using a "linearGradient" tag inside the "defs" tag). 0% = top; 100% = bottom
          var defs = svg.append("defs");
          var lg = defs.append("linearGradient")
            .attr("id","gradient"+i)
            .attr("x1","0%")
            .attr("y1","0%")
            .attr("x2","0%")
            .attr("y2","100%");
          lg.append("stop")
            .attr("offset","0%")
            .style("stop-color",config.axes[i].colorMax)
            .style("stop-opacity","1");
          if ( config.axes[i].colorAverage )
          {
            lg.append("stop")
              .attr("offset","50%")
              .style("stop-color",config.axes[i].colorAverage)
              .style("stop-opacity","1");
          }
          lg.append("stop")
            .attr("offset","100%")
            .style("stop-color",config.axes[i].colorMin)
            .style("stop-opacity","1");
        }



        var g = svg.append("g");
        
        // show color gradient if set
        var axisBonusClasses = "";
        if ( config.axes[i].colorMin && config.axes[i].colorMax )
        {
          axisBonusClasses = "gradient"
          var gradientWidth = 10;
          g.append("rect")
            .attr("x", xScale(i) -gradientWidth/2 )
            .attr("y", config.padding-1 )
            //.attr("y", scales[i](config.axes[i].valueMax) )
            .attr("width",gradientWidth)
            .attr("height",scales[i](config.axes[i].valueMin) - config.padding +1)
            .attr("fill","url(#gradient"+i+")");
        }

        // show vertical axis
        g.append("g")
          .attr("class", "axis "+axisBonusClasses)
          .attr("transform", "translate(" + xScale(i) + ",0)")
          .call(axes[i]);

        // if there is a gradient, edit the axis (which we just created) to show ticks differently
        if ( config.axes[i].colorMin && config.axes[i].colorMax )
        {
          g.selectAll("line")
            .attr("x1","-2")
            .attr("x2","2");
        }

        // show axis label
        g.append("text")
          .attr("y", config.height - config.padding*0.3 )
          .attr("x", xScale(i) )
          .style("text-anchor", "middle")
          .text(config.axes[i].name);

        

        // show descriptions of the minimum and maximum values
        if ( config.axes[i].descriptionMin )
        {
          g.append("text")
            .attr("y", config.height - config.padding*0.7 )
            .attr("x", xScale(i) )
            .style("text-anchor", "middle")
            .text(config.axes[i].descriptionMin);
        }
        if ( config.axes[i].descriptionMax )
        {
          g.append("text")
            .attr("y", config.padding*0.7 )
            .attr("x", xScale(i) )
            .style("text-anchor", "middle")
            .text(config.axes[i].descriptionMax);
        }
        
      }


      // draw the cursors
      svg.selectAll("circle").data(config.axes).enter().append("circle")
        .attr("id", function(d, i){ return "circle"+i; })
        .attr("cx", function(d, i){ return xScale(i); })
        .attr("cy", function(d, i){ return scales[i]((d.valueDefault || d.valueDefault === 0.0) ? d.valueDefault : d.valueMin ); })
        .attr("r", 8)
        .style("fill", function(d,i){ if ( config.axes[i].colorCursor ) return config.axes[i].colorCursor; return "blue"; })
        .style("cursor", "pointer")
        .call(drag);

    };

}]);

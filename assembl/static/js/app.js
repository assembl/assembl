// Filename: app.js
define([
  'jquery',
  'underscore',
  'backbone',
  'router'
],

function($, _, Backbone, AppRouter){

  // Provide a global location to place configuration settings and module
  // creation.
  //var app = {
    // The root path to run the application.
    //root: "/"
  //}

  var initialize = function() {
    AppRouter.initialize();
    //var router = new AppRouter();
    //Backbone.history.start({pushState: true});
  }

   return {
    initialize: initialize
  };
});
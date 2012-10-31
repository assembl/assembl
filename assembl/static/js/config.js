// Set the require.js configuration for your application.
require.config({

  // Initialize the application with the main application file.
  deps: ["main"],

  paths: {
    // JavaScript folders.
    libs: "lib",

    // Libraries.
    jquery: "lib/jquery-1.8.1",
    jqueryui: "lib/jquery-ui-1.9.1.custom",
    backbone: "lib/backbone/backbone",
    bootstrap: "lib/bootstrap",
    underscore: "lib/underscore",
    jsonjs: "lib/JSON-js/json2",
    icanhaz: "lib/ICanHaz"
  },

  shim: {
    // Backbone library depends on jQuery, underscore.js, and json2.js
    backbone: {
      deps: ["jquery", "underscore", "jsonjs", "icanhaz"],
      exports: "Backbone"
    }
  }

});
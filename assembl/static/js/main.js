// Set the require.js configuration for your application.
require.config({
  
  paths: {
    // JavaScript folders.
    libs: "lib",

    // Libraries.
    jquery: "lib/require-jquery",
    jqueryui: 'lib/jquery-ui-1.9.1.custom',
    backbone: "lib/backbone-amd/backbone",
    bootstrap: "lib/bootstrap",
    underscore: "lib/underscore/underscore",
    jsonjs: "lib/JSON-js/json2",
    icanhaz: "lib/ICanHaz"
  },

  shim: {
    // Backbone library depends on jQuery, underscore.js, and json2.js
    backbone: {
      deps: ["underscore", "jsonjs", "icanhaz"],
      exports: "Backbone"
    }
  }
});

require(['app'],
  function(App){
    App.initialize();
  }
);



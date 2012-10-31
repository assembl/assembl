require([
  // Application.
  "app",

  // Main Router.
  "router"
],

function(app, AppRouter){

    app.router = new AppRouter();

    Backbone.history.start({pushState: true});

    $(document).on("click", "a[href^='/']", function(event) {
        if (!event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey) {
            event.preventDefault();
            var url = $(event.currentTarget).attr("href").replace(/^\//, "");
            app.router.navigate(url, { trigger: true });
        }
    });
});



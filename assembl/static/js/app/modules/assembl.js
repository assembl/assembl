define(['marionette'], function (Marionette) {

    var App = new Marionette.Application();

    App.addInitializer(function(){
        App.addRegions({
            headerRegions:'#header',
            notificationRegion:'#notification',
            panelGroupControl:'#panelGroupControl'
        })
    });

    return App;
});
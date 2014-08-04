define(['marionette'], function (Marionette) {

    var App = new Marionette.Application();

    App.addInitializer(function(){
        App.addRegions({
            headerRegions:'#header',
            notificationRegion:'#notification',
            groupControl:'#panelarea',
            groupContainer: '#groupContainer'
        })
    });

    return App;
});
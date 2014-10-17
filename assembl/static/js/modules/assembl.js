define(['marionette'], function (Marionette) {

    var App = new Marionette.Application();

    App.addInitializer(function () {
        App.addRegions({
            headerRegions: '#header',
            notificationRegion: '#notification',
            groupContainer: '#groupContainer',
            adminContainer: '#adminContainer',
            accountContainer: '#accountContainer'
        })
    });

    App.on('start', function () {
        if (Backbone.history) {
            Backbone.history.start({
                pushState: true,
                hashChange: true,
                root: '/'
            });
        }
    });

    return App;
});
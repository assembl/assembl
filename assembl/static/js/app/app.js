'use strict';

define(['backbone.marionette', 'jquery'], function (Marionette, $) {

    var App = new Marionette.Application();

    App.addInitializer(function () {
        App.addRegions({
            headerRegions: '#header',
            notificationRegion: '#notification',
            groupContainer: '#groupContainer',
            contentContainer: '#content-container',
            slider: '#slider'
        })
    });

    App.on('start', function () {
        if (Backbone.history) {
            Backbone.history.start({
                pushState: true,
                root: '/' + $('#discussion-slug').val()
            });

            if (Backbone.history._hasPushState) {
                $(document).delegate("a", "click", function (evt) {
                    var href = $(this).attr("href");
                    var protocol = this.protocol + "//";
                    if (typeof href !== 'undefined' && href.slice(protocol.length) !== protocol && /^#.+$/.test(href)) {
                        evt.preventDefault();
                        Backbone.history.navigate(href, true);
                    }
                });
            }
        }
    });

    return App;
});
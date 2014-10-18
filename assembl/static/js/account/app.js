define(['marionette'], function (Marionette) {
    'use strict';

    var App = new Marionette.Application();

    App.addInitializer(function () {
        App.addRegions({
            headerRegions: '#header',
            contentContainer: '#content-container'
        })
    });

    App.on('start', function () {
        if (Backbone.history) {
            Backbone.history.start({
                pushState: true,
                root: '/' + $('#discussion-slug').val() + '/account'
            });

            if (Backbone.history._hasPushState) {
                $(document).delegate("a", "click", function (evt) {
                    var href = $(this).attr("href"),
                        protocol = this.protocol + "//";
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
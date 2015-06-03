'use strict';

var Marionette = require('../shims/marionette.js'),
    $ = require('../shims/jquery.js');

var Notification = Marionette.LayoutView.extend({
    template: '#tmpl-notification',
    className: 'content-notification',
    events: {
        'click .js_closeNotification': 'closeNotification',
        'click .js_openSession': 'openSession'
    },

    openSession: function (e, options) {

        var model = new Backbone.Model();
        model.set("id", "local:Widget/2");

        if (options)
            model.set("view", options.view);
        else
            model.set("view", "index");

        var Modal = Backbone.Modal.extend({
            template: _.template($('#tmpl-session-modal').html()),
            model: model
        });

        var modalView = new Modal();
        $('.popin-container').html(modalView.render().el);
        this.$('#groupsContainer').addClass('hasNotification');
    },

    closeNotification: function () {
        if (window.localStorage) {
            //benoitg:  Not good, this will close every notification for every discussion!
            // TODO: should be id idea
            window.localStorage.removeItem('showNotification');
        }
        this.remove();
        this.unbind();

        $('#wrapper #groupsContainer').animate({
            top: '36px'
        }, 500);
        this.$('#groupsContainer').removeClass('hasNotification');
    }
});


module.exports = Notification;
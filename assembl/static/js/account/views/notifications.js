define(function (require) {
    'use strict';

    var Marionette = require('marionette');


    var Notifications = Marionette.LayoutView.extend({
        template: '#tmpl-user-notifications',
        className: 'user-notifications',
        initialize: function () {

            console.log('notifications');

        },
        onRender: function () {

        }


    });


    return Notifications;
});
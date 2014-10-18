define(['marionette'], function (Marionette) {
    'use strict';

    var profileEdit = Marionette.ItemView.extend({
        template: '#tmpl-profile-edit',
        className: 'profile-edit',
        initialize: function () {

            console.log('profile edit load');
        },
        onRender: function () {

        }

    });

    return profileEdit;
});
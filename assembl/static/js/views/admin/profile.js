define(function (require) {
    'use strict';

    var Marionette = require('marionette'),
        profileEdit = require('views/admin/profileEdit'),
        $ = require('jquery');

    var userProfile = Marionette.LayoutView.extend({
        template: '#tmpl-profile',
        className: 'profile',
        regions: {
            container: '.profile-container'
        },
        initialize: function () {

        },
        events: {
            'click .menu': 'setView'
        },

        selectMenu: function (menu) {
            this.$('a.menu').parent().removeClass('active');
            this.$('a[data-menu="' + menu + '"]').parent().addClass('active');
        },

        setView: function () {


        },

        resetView: function () {
            //contentLayout.close();
            //contentLayout = new ContentLayout();
            //ContentContainer.show(contentLayout);
        },

        onRender: function () {
            this.selectMenu('profile');
            this.container.show(new profileEdit());
        }

    });

    return userProfile;
});
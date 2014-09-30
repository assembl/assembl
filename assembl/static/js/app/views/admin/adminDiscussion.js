'use strict';

define(function (require) {

    var Marionette = require('marionette'),
        CollectionManager = require('modules/collectionManager');

    var adminDiscussion = Marionette.LayoutView.extend({
        template: '#tmpl-adminDiscussion',
        className: 'discussion-edit',
        initialize: function () {

        },

        onRender: function () {

            console.log('admin discussion');
        }

    });

    return adminDiscussion;
});
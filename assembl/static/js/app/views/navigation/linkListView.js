'use strict';

define(['backbone', 'underscore', 'jquery', 'backbone.marionette'],
    function (Backbone, _, $, Marionette) {

        var SimpleLinkView = Marionette.ItemView.extend({
            template: '#tmpl-simpleLink',
        }),
        LinkListView = Marionette.CollectionView.extend({
            childView: SimpleLinkView,
            initialize: function (options) {
                this.collection = options.collection;
            }
        });
        return LinkListView;
    });

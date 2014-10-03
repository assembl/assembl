'use strict';

define(function (require) {

    var Marionette = require('marionette'),
        CollectionManager = require('modules/collectionManager'),
        _ = require('underscore'),
        Ctx = require('modules/context');

    var adminDiscussion = Marionette.LayoutView.extend({
        template: '#tmpl-adminDiscussion',
        className: 'adminContent',
        initialize: function () {
            if (!this.collection) {
                this.collection = new Backbone.Collection();
            }
        },

        collectionEvents: {
            'add': 'render'
        },

        modelEvents: {
            //'add change':'render'
        },

        serializeData: function () {
            return {
                partners: this.collection.models
            }
        },

        onRender: function () {
            var that = this,
                collectionManager = new CollectionManager();
            //need a solution to pass data to the template after complete promise
            $.when(collectionManager.getAllPartnerOrganizationCollectionPromise()).then(
                function (allPartnerOrganizationCollection) {
                    allPartnerOrganizationCollection.forEach(function (model) {
                        that.collection.add(model)
                    });
                });


            /*$.when(Ctx.getDiscussionPromise()).then(function(discussion) {


             });*/
        }

    });

    return adminDiscussion;
});
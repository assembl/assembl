'use strict';

define(function (require) {

    var Marionette = require('marionette'),
        CollectionManager = require('modules/collectionManager'),
        Ctx = require('modules/context'),
        $ = require('jquery');

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

        events: {
            'click .js_add-partner': 'addPartner'
        },

        serializeData: function () {
            return {
                partners: this.collection.models,
                ctx: Ctx
            }
        },

        onRender: function () {
            this.getPartners();
        },

        getPartners: function () {
            var that = this,
                collectionManager = new CollectionManager();
            //need a solution to pass data to the template after complete promise
            $.when(collectionManager.getAllPartnerOrganizationCollectionPromise()).then(
                function (allPartnerOrganizationCollection) {
                    allPartnerOrganizationCollection.forEach(function (model) {
                        that.collection.add(model)
                    });
                });
        },

        addPartner: function (e) {
            e.preventDefault();

            var dataPartner = $(e.target).parent('form').serialize(),
                urlPartner = '/data/Discussion/' + Ctx.getDiscussionId() + '/partner_organizations/';

            $.ajax({
                url: urlPartner,
                type: "post",
                data: dataPartner,
                success: function () {
                },
                error: function () {
                }
            });
        }

    });

    return adminDiscussion;
});
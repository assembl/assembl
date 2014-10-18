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
            var that = this,
                collectionManager = new CollectionManager();

            this.collection = new Backbone.Collection();

            $.when(collectionManager.getAllPartnerOrganizationCollectionPromise()).then(
                function (allPartnerOrganization) {
                    that.collection.add(allPartnerOrganization.models)
                });
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
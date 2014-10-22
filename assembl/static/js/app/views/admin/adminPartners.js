define(['marionette', 'jquery', 'common/collectionManager', 'common/context'],
    function (Marionette, $, CollectionManager, Ctx) {
        'use strict';


        var adminPartners = Marionette.LayoutView.extend({
            template: '#tmpl-adminPartners',
            className: 'admin-partners prs',
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

        return adminPartners;
    });
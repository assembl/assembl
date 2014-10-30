'use strict';

define(['backbone.marionette', 'jquery', 'common/collectionManager', 'common/context'],
    function (Marionette, $, CollectionManager, Ctx) {

        var adminDiscussion = Marionette.LayoutView.extend({
            template: '#tmpl-adminDiscussion',
            className: 'admin-notifications',
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


            serializeData: function () {
                return {
                    ctx: Ctx
                }
            }

        });

        return adminDiscussion;
    });
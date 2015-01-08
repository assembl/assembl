'use strict';

define(['backbone.marionette', 'jquery', 'common/collectionManager', 'common/context', 'utils/i18n'],
    function (Marionette, $, CollectionManager, Ctx, i18n) {

        var adminPartners = Marionette.LayoutView.extend({
            template: '#tmpl-adminPartners',
            className: 'admin-notifications',
            ui: {
                partners: '.js_add-partner'
            },
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
                'click @ui.partners': 'addPartner'
            },

            serializeData: function () {
                return {
                    partners: this.collection.models,
                    Ctx: Ctx
                }
            },

            onRender: function () {
                Ctx.initTooltips(this.$el);
            },

            addPartner: function (e) {
                e.preventDefault();

                var inputs = this.$('input[required=required]'),
                    dataPartner = this.$('#form-partner').serialize(),
                    urlPartner = '/data/Discussion/' + Ctx.getDiscussionId() + '/partner_organizations/',
                    regexUrl = /^(http|https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;

                inputs.each(function (index) {
                    var parent = $(this).parent().parent();

                    if (!$(this).val()) {
                        parent.addClass('error');
                        return false;

                    } else if ($(this).val()) {

                        if ($(this).hasClass('partner-homepage')) {
                            if (!regexUrl.test($(this).val())) {
                                parent.addClass('error');
                                return false;
                            } else {
                                parent.removeClass('error');
                                return true;
                            }
                        }
                        if ($(this).hasClass('partner-logo')) {
                            if (!regexUrl.test($(this).val())) {
                                parent.addClass('error');
                                return false;
                            } else {
                                parent.removeClass('error');
                                return true;
                            }
                        }

                        parent.removeClass('error');
                    }

                });

                if (this.$('.partner-name').val() && this.$('.partner-description').val() &&
                    this.$('.partner-homepage').val() && this.$('.partner-logo').val()) {

                    $.ajax({
                        url: urlPartner,
                        type: "post",
                        data: dataPartner,
                        success: function (response, text) {
                            alert(i18n.gettext('your partners has been posted'));
                        },
                        error: function (request, status, error) {
                            alert(status + ': ' + error);
                        }
                    });

                }

            }


        });

        return adminPartners;
    });
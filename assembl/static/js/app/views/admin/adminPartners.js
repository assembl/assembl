'use strict';

define(['backbone.marionette', 'jquery', 'common/collectionManager', 'common/context', 'utils/i18n'],
    function (Marionette, $, CollectionManager, Ctx, i18n) {

        var adminPartners = Marionette.LayoutView.extend({
            template: '#tmpl-adminPartners',
            className: 'admin-notifications',
            ui: {
                partners: '.js_add-partner',
                close: '.bx-alert-success .bx-close'
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
                'click @ui.partners': 'addPartner',
                'click @ui.close': 'close'
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

            close: function () {
                this.$('.bx-alert-success').addClass('hidden');
            },

            addPartner: function (e) {
                e.preventDefault();

                var that = this,
                    inputs = this.$('*[required=required]'),
                    dataPartner = this.$('#form-partner').serialize(),
                    urlPartner = '/data/Discussion/' + Ctx.getDiscussionId() + '/partner_organizations/',
                    regexUrl = /^(http|https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/,
                    controls = document.querySelectorAll('#form-partner .control-group');

                inputs.each(function () {
                    var parent = $(this).parent().parent();

                    if (!$(this).val()) {
                        parent.addClass('error');
                    }
                    if ($(this).val()) {
                        parent.removeClass('error').addClass('success');

                        if ($(this).hasClass('partner-homepage')) {
                            if (!regexUrl.test($(this).val())) {
                                parent.addClass('error').removeClass('success');
                            } else {
                                parent.removeClass('error').addClass('success');
                            }
                        }
                        if ($(this).hasClass('partner-logo')) {
                            if (!regexUrl.test($(this).val())) {
                                parent.addClass('error').removeClass('success');
                            } else {
                                parent.removeClass('error').addClass('success');
                            }
                        }
                    }
                });

                if(!$(controls).hasClass('error')){
                    var inputs = document.querySelectorAll('#form-partner *[required=required]');
                    $(controls).removeClass('success');
                    $(inputs).val('');

                    $.ajax({
                        url: urlPartner,
                        type: "post",
                        data: dataPartner,
                        success: function (response, text) {
                          that.render();
                          that.$('.bx-alert-success').removeClass('hidden');
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
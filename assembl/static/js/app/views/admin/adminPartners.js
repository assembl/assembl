'use strict';

define(['backbone.marionette', 'app','jquery', 'common/collectionManager', 'common/context', 'utils/i18n', 'backbone.modal', 'backbone.marionette.modals', 'models/partners'],
    function (Marionette, Assembl, $, CollectionManager, Ctx, i18n, backboneModal, marionetteModal, partnerModel) {

        var Partners = Marionette.ItemView.extend({
            template: '#tmpl-partnersInAdmin',
            className: 'gr',
            ui: {
              'partnerItem':'.js_deletePartner',
              'partnerItemEdit': '.js_editPartner'
            },
            events: {
                'click @ui.partnerItem':'deletePartner',
                'click @ui.partnerItemEdit': 'editPartner'
            },
            serializeData: function(){
                return {
                    partner: this.model
                }
            },
            deletePartner: function(){
               var that = this;
               this.model.destroy({
                  success: function(){
                     that.$el.fadeOut();
                  },
                  error: function(){

                  }
               });
            },
            editPartner: function(){
                var self = this;

                var Modal = Backbone.Modal.extend({
                    template: _.template($('#tmpl-adminPartnerForm').html()),
                    className: 'partner-modal popin-wrapper',
                    cancelEl: '.close, .js_close',
                    keyControl: false,
                    model: self.model,
                    initialize: function () {
                        this.$('.bbm-modal').addClass('popin');
                    },
                    events: {
                        'click .js_validatePartner' :'validatePartner'
                    },
                    validatePartner: function (e) {

                        var that = this,
                            inputs = this.$('*[required=required]'),
                            dataPartner = this.$('#partner-form').serialize(),
                            urlPartner = '/data/Discussion/' + Ctx.getDiscussionId() + '/partner_organizations/',
                            regexUrl = /^(http|https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/,
                            controls = document.querySelectorAll('#partner-form .control-group');

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
                            var inputs = document.querySelectorAll('#partner-form *[required=required]');
                            $(controls).removeClass('success');
                            $(inputs).val('');

                            $.ajax({
                                url: urlPartner,
                                type: "post",
                                data: dataPartner,
                                success: function (response, text) {
                                    self.render();
                                    that.triggerSubmit();
                                },
                                error: function (request, status, error) {
                                    alert(status + ': ' + error);
                                }
                            });

                        }

                    }
                });

                var modal = new Modal();

                Assembl.slider.show(modal);

            }
        });

        var ParnerList = Marionette.CollectionView.extend({
            childView: Partners,
            initialize: function(){
                var that = this,
                    collectionManager = new CollectionManager();

                this.collection = undefined;

                $.when(collectionManager.getAllPartnerOrganizationCollectionPromise()).then(
                    function (allPartnerOrganization) {
                        that.collection = allPartnerOrganization;
                        that.render();
                    });
            }
        });

        var adminPartners = Marionette.LayoutView.extend({
            template: '#tmpl-adminPartners',
            className: 'admin-notifications',
            ui: {
              partners: '.js_addPartner',
              close: '.bx-alert-success .bx-close'
            },

            regions: {
              partner: '#partner-content'
            },

            events: {
                'click @ui.partners': 'addNewPartner',
                'click @ui.close': 'close'
            },

            serializeData: function () {
                return {
                    Ctx: Ctx
                }
            },

            onRender: function () {
                Ctx.initTooltips(this.$el);

                var parnerList = new ParnerList();

                this.partner.show(parnerList);
            },

            close: function () {
                this.$('.bx-alert-success').addClass('hidden');
            },

            addNewPartner: function(){
                var self = this;

                var Modal = Backbone.Modal.extend({
                    template: _.template($('#tmpl-adminPartnerForm').html()),
                    className: 'partner-modal popin-wrapper',
                    cancelEl: '.close, .js_close',
                    keyControl: false,
                    initialize: function () {
                        this.$('.bbm-modal').addClass('popin');
                    },
                    events: {
                     'click .js_validatePartner' :'validatePartner'
                    },
                    validatePartner: function (e) {

                        var that = this,
                            inputs = this.$('*[required=required]'),
                            regexUrl = /^(http|https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/,
                            controls = document.querySelectorAll('#partner-form .control-group');

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
                            var inputs = document.querySelectorAll('#partner-form *[required=required]');
                            $(controls).removeClass('success');

                            var partner = new partnerModel.Model({
                                description: this.$('.partner-description').val(),
                                homepage: this.$('.partner-homepage').val(),
                                logo: this.$('.partner-logo').val(),
                                name: this.$('.partner-name').val(),
                                is_initiator: (this.$('.partner-initiator:checked').val()) ? true : false
                            });

                            partner.save(null, {
                                success: function(model, resp){
                                    $(inputs).val('');
                                    self.render();
                                    that.triggerSubmit();
                                },
                                error: function(model, resp){
                                    console.log(resp)
                                }
                            })

                        }

                    }
                });

                var modal = new Modal();

                Assembl.slider.show(modal);

            }


        });

        return adminPartners;
    });
'use strict';

var Marionette = require('../../shims/marionette.js'),
    Assembl = require('../../app.js'),
    $ = require('../../shims/jquery.js'),
    CollectionManager = require('../../common/collectionManager.js'),
    Ctx = require('../../common/context.js'),
    i18n = require('../../utils/i18n.js'),
    partnerModel = require('../../models/partners.js');

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

    modelEvents: {
        'change':'render'
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
            template: _.template($('#tmpl-adminPartnerEditForm').html()),
            className: 'partner-modal popin-wrapper',
            cancelEl: '.close, .js_close',
            keyControl: false,
            model: self.model,
            initialize: function () {
                this.$('.bbm-modal').addClass('popin');
            },
            events: {
                'submit #partner-form-edit' :'validatePartner'
            },
            validatePartner: function (e) {

                if(e.target.checkValidity()){

                    var that = this;

                    self.model.set({
                        description: this.$('.partner-description').val(),
                        homepage: this.$('.partner-homepage').val(),
                        logo: this.$('.partner-logo').val(),
                        name: this.$('.partner-name').val(),
                        is_initiator: (this.$('.partner-initiator:checked').val()) ? true : false
                    });

                    self.model.save(null, {
                        success: function(model, resp){
                            that.triggerSubmit();
                        },
                        error: function(model, resp){
                            console.log(resp)
                        }
                    });

                }

                return false;
            }
        });

        var modal = new Modal();

        Assembl.slider.show(modal);

    }
});

var PartnerList = Marionette.CollectionView.extend({
    childView: Partners,
    collectionEvents: {
        'add sync':'render'
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

    onBeforeShow: function(){
        var that = this,
            collectionManager = new CollectionManager();

        Ctx.initTooltips(this.$el);

        collectionManager.getAllPartnerOrganizationCollectionPromise()
            .then(function (allPartnerOrganization) {

                var partnerList = new PartnerList({
                    collection: allPartnerOrganization
                });

                that.partners = allPartnerOrganization;

                that.getRegion('partner').show(partnerList);
            });

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
             'submit #partner-form' :'validatePartner'
            },
            validatePartner: function (e) {

                if(e.target.checkValidity()){

                    var inputs = document.querySelectorAll('#partner-form *[required]'),
                    that = this;

                    var partner = new partnerModel.Model({
                        description: this.$('.partner-description').val(),
                        homepage: this.$('.partner-homepage').val(),
                        logo: this.$('.partner-logo').val(),
                        name: this.$('.partner-name').val(),
                        is_initiator: (this.$('.partner-initiator:checked').val()) ? true : false
                    });

                    partner.save(null, {
                        success: function(model, resp){
                            that.destroy();
                            $(inputs).val('');
                            self.partners.fetch();
                        },
                        error: function(model, resp){
                            console.log(resp)
                        }
                    })

                }

                return false;
            }
        });

        var modal = new Modal();

        Assembl.slider.show(modal);

    }


});

module.exports = adminPartners;
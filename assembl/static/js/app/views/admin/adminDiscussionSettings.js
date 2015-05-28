"use strict";

var Marionette = require('../../shims/marionette.js'),
    i18n = require('../../utils/i18n.js'),
    CollectionManager = require('../../common/collectionManager.js'),
    Promise = require('bluebird');


var DiscussionSettings = Marionette.ItemView.extend({
    template: '#tmpl-discussionSource',
    ui: {
        source:'.js_saveSource',
        reimport: '.js_reimport',
        reprocess: '.js_reprocess'
    },
    events: {
        'click @ui.source':'saveSource',
        'click @ui.reimport':'reimportSource',
        'click @ui.reprocess':'reprocessSource'
    },
    reimportSource: function(e) {
        e.preventDefault();
        var msg = 'This will take several minutes! You cannot leave the page in the meantime. Are you sure you want to continue?';
        console.log('this.model is :', this.model);
        if ( confirm(i18n.gettext(msg)) ) {
            return Promise.resolve(this.model.doReimport()).then( function(whatever) {
                $.bootstrapGrowl(i18n.gettext('Reimport has begun! It can take up to 15 minutes to complete.'), {
                    ele: 'body',
                    type: 'success',
                    offset: {from: 'bottom', amount:20},
                    align: 'left',
                    delay: 4000,
                    allow_dismiss: true,
                    stackup_spacing: 10
                });
            }).catch(function(e){
                $.bootstrapGrowl(i18n.gettext('Reimport failed'), {
                    ele: 'body',
                    type: 'error',
                    offset: {from: 'bottom', amount:20},
                    align: 'left',
                    delay: 4000,
                    allow_dismiss: true,
                    stackup_spacing: 10
                });
            });
        }
        else {
            //do nothing
        }
        return false;
    },
    reprocessSource: function(e) {
        e.preventDefault();
        var msg = 'This will take several minutes! You cannot leave the page in the meantime. Are you sure you want to continue?';
        if ( confirm(i18n.gettext(msg)) ) {
            return Promise.resolve(this.model.doReprocess()).then( function(whatever) {
                $.bootstrapGrowl(i18n.gettext('Reprocess has begun! It can take up to 15 minutes to complete.'), {
                    ele: 'body',
                    type: 'success',
                    offset: {from: 'bottom', amount:20},
                    align: 'left',
                    delay: 4000,
                    allow_dismiss: true,
                    stackup_spacing: 10
                });
            }).catch(function(e){
                $.bootstrapGrowl(i18n.gettext('Reimport failed'), {
                    ele: 'body',
                    type: 'error',
                    offset: {from: 'bottom', amount:20},
                    align: 'left',
                    delay: 4000,
                    allow_dismiss: true,
                    stackup_spacing: 10
                });
            });
        }
        else {
            //do absolutely nothing
        }
        return false;
    },
    saveSource: function(e){
        e.preventDefault();

        var name = this.$('#name').val(),
            admin_sender = this.$('#admin_sender').val(),
            post_email_address = this.$('#post_email_address').val(),
            host = this.$('#host').val(),
            use_ssl = this.$('#use_ssl:checked').val(),
            folder = this.$('#folder').val(),
            port = parseInt(this.$('#port').val()),
            username = this.$('#username').val(),
            password = this.$('#password').val();

        this.model.set({
            name : name,
            admin_sender : admin_sender,
            post_email_address : post_email_address,
            host : host,
            use_ssl : use_ssl,
            folder : folder,
            port : port,
            username: username,
            password: password
        });

        this.model.save(null, {
            success: function(model, resp){

                $.bootstrapGrowl(i18n.gettext('Your settings were saved'), {
                   ele: 'body',
                   type: 'success',
                   offset: {from: 'bottom', amount:20},
                   align: 'left',
                   delay: 4000,
                   allow_dismiss: true,
                   stackup_spacing: 10
                });

            },
            error: function(model, resp){

                $.bootstrapGrowl(i18n.gettext('Your settings fail to update'), {
                    ele: 'body',
                    type: 'error',
                    offset: {from: 'bottom', amount:20},
                    align: 'left',
                    delay: 4000,
                    allow_dismiss: true,
                    stackup_spacing: 10
                });

            }
        });
    }
});

var DiscussionSourceList = Marionette.CollectionView.extend({
    childView: DiscussionSettings
});

var AdminDiscussionSettings = Marionette.LayoutView.extend({
    template: '#tmpl-adminDiscussionSettings',
    className: 'admin-settings',
    regions: {
        source: "#source-container"
    },
    onBeforeShow: function(){
        var that = this,
            collectionManager = new CollectionManager();

        collectionManager.getDiscussionSourceCollectionPromise()
            .then(function(DiscussionSource){

            var discussionSourceList = new DiscussionSourceList({
                collection: DiscussionSource
            });
            that.getRegion('source').show(discussionSourceList);
        })

    }
});


module.exports = AdminDiscussionSettings;

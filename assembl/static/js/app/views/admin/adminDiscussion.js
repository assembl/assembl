'use strict';

var Marionette = require('../../shims/marionette.js'),
    $ = require('../../shims/jquery.js'),
    _ = require('../../shims/underscore.js'),
    autosize = require('jquery-autosize'),
    CollectionManager = require('../../common/collectionManager.js'),
    Ctx = require('../../common/context.js'),
    Discussion = require('../../models/discussion.js'),
    DiscussionSource = require('../../models/discussionSource.js'),
    i18n = require('../../utils/i18n.js');


var adminDiscussion = Marionette.ItemView.extend({
    template: '#tmpl-adminDiscussion',
    className: 'admin-notifications',
    ui: {
      discussion: '.js_saveDiscussion'
    },
    initialize: function () {
        var that = this,
            collectionManager = new CollectionManager();

        this.model = undefined;

        collectionManager.getDiscussionModelPromise()
            .then(function (Discussion){
                that.model =  Discussion;
                that.render();
            });

    },
    onRender: function(){
        this.$('#introduction').autosize();
    },
    events: {
      'click @ui.discussion': 'saveDiscussion'
    },

    serializeData: function () {
        return {
            discussion: this.model,
            Ctx: Ctx
        }
    },

    saveDiscussion: function (e) {
        e.preventDefault();

        var introduction = this.$('textarea[name=introduction]').val(),
            topic = this.$('input[name=topic]').val(),
            slug = this.$('input[name=slug]').val(),
            objectives = this.$('textarea[name=objectives]').val(),
            web_analytics_piwik_id_site = parseInt(this.$('#web_analytics_piwik_id_site').val()),
            help_url = this.$('#help_url').val(),
            show_help_in_debate_section = this.$('#show_help_in_debate_section:checked').length == 1;

        this.model.set({
            introduction:introduction,
            topic: topic,
            slug: slug,
            objectives: objectives,
            web_analytics_piwik_id_site: web_analytics_piwik_id_site,
            help_url: help_url,
            show_help_in_debate_section: show_help_in_debate_section
        });

        this.model.save(null, {
            success: function (model, resp) {
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
            error: function (model, resp) {
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
        })

    }

});

module.exports = adminDiscussion;
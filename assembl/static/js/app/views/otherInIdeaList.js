'use strict';

var Ctx = require('../common/context.js'),
    IdeaView = require('./idea.js'),
    _ = require('../shims/underscore.js');


var otherInIdeaList = IdeaView.extend({
    template: Ctx.loadTemplate('otherInIdeaList'),
    render: function () {
        Ctx.removeCurrentlyDisplayedTooltips(this.$el);

        var hasOrphanPosts = this.model.get('num_orphan_posts'),
            hasSynthesisPosts = this.model.get('num_synthesis_posts');

        var subMenu = _.find([hasOrphanPosts, hasSynthesisPosts], function (num) {
            return num !== 0;
        });

        if (typeof subMenu === 'undefined') {

            this.$el.addClass('hidden');
        } else {
            this.$el.removeClass('hidden');
        }

        this.$el.html(this.template);
        Ctx.initTooltips(this.$el);
        return this;
    }
});


module.exports = otherInIdeaList;

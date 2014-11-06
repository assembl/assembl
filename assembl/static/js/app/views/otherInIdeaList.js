define(function (require) {
    'use strict';

    var Ctx = require('common/context'),
        IdeaView = require('views/idea');

    var otherInIdeaList = IdeaView.extend({
        template: Ctx.loadTemplate('otherInIdeaList'),
        render: function () {
            Ctx.removeCurrentlyDisplayedTooltips(this.$el);

            this.$el.addClass('idealist-item');

            var hasOrphanPosts = this.model.get('num_orphan_posts'),
                hasReadPosts = this.model.get('num_read_posts'),
                hasSynthesisPosts = this.model.get('num_synthesis_posts'),
                hasPosts = this.model.get('num_posts');

            if (hasOrphanPosts === 0 || hasReadPosts === 0 ||
                hasSynthesisPosts === 0 || hasPosts === 0) {

                this.$el.addClass('hidden');
            }

            this.$el.html(this.template);
            Ctx.initTooltips(this.$el);
            return this;
        }
    });


    return otherInIdeaList;
});

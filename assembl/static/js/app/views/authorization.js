define(['backbone.marionette', 'common/context'], function (Marionette, Ctx) {

    var authorization = Marionette.LayoutView.extend({
        template: '#tmpl-authorization',
        className: 'authorization',
        templateHelpers: function () {
            return {
                urlLogIn: function () {
                    return '/login?next_view=/' + Ctx.getDiscussionSlug() + '/';
                }
            }
        }
    });

    return authorization;
});
define(['models/base', 'common/context'], function (Base, Ctx) {

    var roleModel = Base.Model.extend({
        urlRoot: Ctx.getApiV2DiscussionUrl("/all_users/" + Ctx.getCurrentUserId() + "/local_roles"),
        defaults: {
            'requested': false,
            'discussion': "",
            'role': "",
            'user': "",
            '@id': "",
            '@type': "",
            '@view': ""
        }

    });

    var roleCollection = Base.Collection.extend({
        url: Ctx.getApiV2DiscussionUrl("/all_users/" + Ctx.getCurrentUserId() + "/local_roles"),
        model: roleModel
    });

    return {
        Model: roleModel,
        Collection: roleCollection
    };
});
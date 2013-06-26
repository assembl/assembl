define(['backbone'], function(Backbone){
    'use strict';

    /**
     * @class InboxModel
     */
    var InboxModel = Backbone.Model.extend({
        defaults: {
            currentFilter: 1
        },
        filters: {
            ALL: 1,
            ACTIVE: 2,
            FEATURED: 3
        }
    });

    return InboxModel;
});

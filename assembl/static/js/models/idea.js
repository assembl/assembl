define(['backbone'], function(Backbone){
    'use strict';

    /**
     * @class Idea
     */
    var IdeaModel = Backbone.Model.extend({
        url: "/static/js/tests/fixtures/idea.json",
        defaults: {
            subject: '',
            level: 1,
            total: 1,
            hasCheckbox: true,
            hasChildren: false,
            hasOptions: true,
            featured: false,
            active: false
        }
    });

    /**
     * @class IdeaColleciton
     */
    var IdeaCollection = Backbone.Collection.extend({
        url: "/static/js/tests/fixtures/ideas.json",
        model: IdeaModel
    });

    return {
        Model: IdeaModel,
        Collection: IdeaCollection
    };

});

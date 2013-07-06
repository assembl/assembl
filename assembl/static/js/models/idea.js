define(['backbone'], function(Backbone){
    'use strict';

    /**
     * @class IdeaModel
     */
    var IdeaModel = Backbone.Model.extend({
        initialize: function(obj){
            if( obj && _.isArray(obj.children) ){
                _.each(obj.children, function(child, i){
                    if( IdeaModel !== child.constructor ){
                        obj.children[i] = new IdeaModel(child);
                    }
                });
            }
        },
        url: "/static/js/tests/fixtures/idea.json",
        defaults: {
            subject: '',
            level: 1,
            total: 1,
            isOpen: false,
            hasCheckbox: true,
            hasChildren: false,
            hasOptions: true,
            featured: false,
            active: false,
            children: []
        },

        /**
         * Adds an idea as child
         * @param  {Idea} idea
         */
        addChild: function(idea){
            var children = this.get('children');
            children.push(idea);
            this.set('children', children);
            this.set('hasChildren', true);
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

define(['backbone', 'models/segment'], function(Backbone, Segment){
    'use strict';

    /**
     * @class IdeaModel
     */
    var IdeaModel = Backbone.Model.extend({
        initialize: function(obj){
            obj = obj || {};

            if( _.isArray(obj.children) ){
                _.each(obj.children, function(child, i){
                    if( IdeaModel !== child.constructor ){
                        obj.children[i] = new IdeaModel(child);
                    }
                });
            }

            obj.segments = obj.segments && obj.segments.length ? obj.segments : [];
            this.set('segments', new Segment.Collection(obj.segments) );
        },
        url: "/static/js/tests/fixtures/idea.json",
        defaults: {
            shortTitle: '',
            longTitle: '',
            level: 1,
            total: 1,
            isOpen: false,
            hasCheckbox: true,
            hasChildren: false,
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
        },

        /**
         * Adds a segment
         * @param  {Segment} segment
         */
        addSegment: function(segment){
            this.attributes.segments.add(segment);
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

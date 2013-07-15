define(['backbone', 'models/segment'], function(Backbone, Segment){
    'use strict';

    /**
     * @class IdeaModel
     */
    var IdeaModel = Backbone.Model.extend({
        /**
         * @init
         */
        initialize: function(obj){
            obj = obj || {};
            var that = this;

            obj.segments = obj.segments && obj.segments.length ? obj.segments : [];
            this.set( 'segments', new Segment.Collection(obj.segments) );

            obj.creationDate = obj.creationDate || app.getCurrentTime();
            this.set( 'creationDate', obj.creationDate );
        },

        /**
         * Url
         * @type {String}
         */
        url: "/api/idea",

        /**
         * Defaults
         */
        defaults: {
            shortTitle: 'New idea',
            longTitle: 'Please add a description',
            total: 1,
            isOpen: false,
            hasCheckbox: true,
            featured: false,
            active: false,
            inSynthesis: false,
            parentId: null
        },

        /**
         * Adds an idea as child
         * @param  {Idea} idea
         */
        addChild: function(idea){
            this.collection.add(idea);

            if( this.isDescendantOf(idea) ){
                this.set('parentId', null);
            }

            idea.set('parentId', this.get('id'));
        },

        /**
         * Adds an idea as sibling above
         * @param {Idea} idea
         */
        addSiblingAbove: function(idea){
            var parent = this.getParent(),
                parentId = parent ? parent.get('id') : null,
                index = this.collection.indexOf(this);

            this.collection.add(idea, { at: index });
            idea.attributes.parentId = parentId;
            idea.trigger('change:parentId');
        },

        /**
         * Adds an idea as sibling below
         * @param {Idea} idea
         */
        addSiblingBelow: function(idea){
            var parent = this.getParent(),
                parentId = parent ? parent.get('id') : null,
                index = this.collection.indexOf(this) + 1;

            this.collection.add(idea, { at: index });
            idea.attributes.parentId = parentId;
            idea.trigger('change:parentId');
        },

        /**
         * Return all children
         * @return {Idea[]}
         */
        getChildren: function(){
            return this.collection.where({ parentId: this.get('id') });
        },

        /**
         * Return the parent idea
         * @return {Idea}
         */
        getParent: function(){
            return this.collection.findWhere({ id: this.get('parentId') });
        },

        /**
         * Return if the idea is descendant of the given idea
         * @param {Idea} idea 
         * @return {Boolean}
         */
        isDescendantOf: function(idea){
            var parentId = this.get('parentId');

            if( parentId === idea.get('id') ){
                return true;
            }

            return parentId === null ? false : this.getParent().isDescendantOf( idea );
        },

        /**
         * Return the indentantion level
         * @return {Number}
         */
        getLevel: function(){
            var counter = 0,
                parent = this;

            do {
                parent = parent.get('parentId') !== null ? parent.getParent() : null;
                counter += 1;
            } while ( parent !== null );

            return counter;
        },

        /**
         * Adds a segment
         * @param  {Segment} segment
         */
        addSegment: function(segment){
            this.attributes.segments.add(segment);
        },

        /**
         * Adds a segment as a child
         * @param {Segment} segment
         */
        addSegmentAsChild: function(segment){
            var idea = new IdeaModel({
                shortTitle: segment.get('text').substr(0, 50),
                longTitle: segment.get('text')
            });

            this.addChild(idea);
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

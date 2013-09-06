define(['backbone','underscore', 'models/segment', 'app'], function(Backbone, _, Segment, app){
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

            obj.creationDate = obj.creationDate || app.getCurrentTime();
            this.set('creationDate', obj.creationDate);

            this.on('change:inSynthesis', this.onInSynthesisChange, this);
            this.on('change:shortTitle change:longTitle change:parentId', this.onAttrChange, this);
        },

        /**
         * Url
         * @type {String}
         */
        urlRoot: app.getApiUrl("ideas"),

        /**
         * Defaults
         */
        defaults: {
            shortTitle: 'New idea',
            longTitle: '',
            total: 0,
            isOpen: true,
            hasCheckbox: true,
            featured: false,
            active: false,
            inSynthesis: false,
            parentId: null
        },

        /**
         * Adds an idea as child
         * @param  {Idea} idea
         * @param {Segment} [segment=null]
         */
        addChild: function(idea, segment){
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

            return parentId === null ? false : this.getParent().isDescendantOf(idea);
        },

        /**
         * @return {Number} the indentantion level
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
         * @return {Number} The level based in the parents inSynthesis flag
         */
        getSynthesisLevel: function(){
            var counter = 0,
                parent = this;

            do {

                if( parent.get('parentId') !== null ){
                    parent = parent.getParent();
                    if( parent.get('inSynthesis') ){
                        counter += 1;
                    }
                } else {
                    parent = null;
                }
                
            } while ( parent !== null );

            return counter;
        },

        /**
         * @return {array<Segment>}
         */
        getSegments: function(){
            return app.getSegmentsByIdea(this);
        },

        /**
         * Adds a segment
         * @param  {Segment} segment
         */
        addSegment: function(segment){
            segment.set('idIdea', this.get('id'));
            this.trigger("change:segments");
        },

        /**
         * Adds a segment as a child
         * @param {Segment} segment
         */
        addSegmentAsChild: function(segment){
            var data = {
                shortTitle: segment.get('text').substr(0, 50),
                longTitle: segment.get('text'),
                parentId: this.get('id')
            };

            var onSuccess = function(idea){
                idea.addSegment(segment);
            };

            this.collection.create(data, { success: onSuccess });
        },

        /**
         * @event
         */
        onInSynthesisChange: function(){
            var value = this.get('inSynthesis');
            this.save({ inSynthesis: value });
        },

        /**
         * @event
         */
        onAttrChange: function(){
            this.save();
        }

    });

    /**
     * @class IdeaColleciton
     */
    var IdeaCollection = Backbone.Collection.extend({
        /**
         * Url
         * @type {String}
         */
        url: app.getApiUrl("ideas"),

        /**
         * The model
         * @type {IdeaModel}
         */
        model: IdeaModel,

        /**
         * Returns the ideas to compose the synsthesis panel
         */
        getInSynthesisIdeas: function(){
            var ideas = this.where({inSynthesis: true}),
                result = [];

            _.each(ideas, function(idea){
                if( idea.getSynthesisLevel() === 0 ){
                    result.push( idea );
                }
            });

            return result;
        }

    });

    return {
        Model: IdeaModel,
        Collection: IdeaCollection
    };

});

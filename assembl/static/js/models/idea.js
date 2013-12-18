define(['models/base','underscore', 'models/segment', 'app', 'i18n'], function(Base, _, Segment, app, i18n){
    'use strict';

    /**
     * @class IdeaModel
     */
    var IdeaModel = Base.Model.extend({

        /**
         * @init
         */
        initialize: function(obj){
            obj = obj || {};
            var that = this;

            obj.creationDate = obj.creationDate || app.getCurrentTime();
            this.set('creationDate', obj.creationDate);

            this.on('change:inNextSynthesis', this.onInNextSynthesisChange, this);
            this.on('change:shortTitle change:longTitle change:parentId', this.onAttrChange, this);

            app.on('synthesisPanel:edit', function(){
                that.attributes['synthesisPanel-editing'] = false;
            });
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
            shortTitle: i18n.gettext('New idea'),
            longTitle: '',
            numChildIdea: 0,
            num_posts: 0,
            isOpen: true,
            hasCheckbox: true,
            featured: false,
            active: false,
            inNextSynthesis: false,
            parentId: null,
            order: 1
        },
        /* The following should be mostly in view code, but currently the
         * longTitle editor code isn't common in ideaPanel and synthesisView
         * At least this is mostly DRY
         */

        /**
         * Returns the display text for a synthesis idea.
         * Will return the first non-empty from:
         * longTitle, shortTitle, i18n.gettext('Add the description')
         * @param
         * @return {Text>}
         */
        getLongTitleDisplayText: function(){

            if( app.stripHtml(this.get('longTitle')) !== '' ){
                return this.get('longTitle');
            } else if ( app.stripHtml(this.get('shortTitle')) !== '' ){
                return this.get('shortTitle');
            } else {
                return i18n.gettext('Add the description');
            }

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

            idea.set('order', this.getOrderForNewChild());
            idea.set('parentId', this.getId());
        },

        /**
         * Adds an idea as sibling above
         * @param {Idea} idea
         */
        addSiblingAbove: function(idea){
            var parent = this.getParent(),
                parentId = parent ? parent.getId() : null,
                index = this.collection.indexOf(this),
                order = this.get('order') - 0.1;

            this.collection.add(idea, { at: index });
            idea.attributes.parentId = parentId;
            idea.attributes.order = order;
            idea.trigger('change:parentId');

            if( parent ){
                parent.updateChildrenOrder();
            } else {
                app.updateIdealistOrder();
            }
        },

        /**
         * Adds an idea as sibling below
         * @param {Idea} idea
         */
        addSiblingBelow: function(idea){
            var parent = this.getParent(),
                parentId = parent ? parent.getId() : null,
                index = this.collection.indexOf(this) + 1,
                order = this.get('order') + 0.1;

            this.collection.add(idea, { at: index });
            idea.attributes.parentId = parentId;
            idea.attributes.order = order;
            idea.trigger('change:parentId');

            if( parent ){
                parent.updateChildrenOrder();
            } else {
                app.updateIdealistOrder();
            }
        },

        /**
         * Return all children
         * @return {Idea[]}
         */
        getChildren: function(){
            return this.collection.where({ parentId: this.getId() });
        },

        /**
         * Return the parent idea
         * @return {Idea}
         */
        getParent: function(){
            return this.collection.findWhere({ '@id': this.get('parentId') });
        },

        /**
         * Return all children which belongs to the synthesis
         * @return {Idea[]}
         */
        getSynthesisChildren: function(){
            var children = this.collection.where({ parentId: this.getId() }),
                result = [];

            _.each(children, function(child){
                if( child.get('inNextSynthesis') === true ){
                    result.push(child);
                } else {
                    result = _.union(result, child.getSynthesisChildren());
                }
            });

            return result;
        },

        /**
         * Return if the idea is descendant of the given idea
         * @param {Idea} idea
         * @return {Boolean}
         */
        isDescendantOf: function(idea){
            var parentId = this.get('parentId');

            if( parentId === idea.getId() ){
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
                parent = parent.get('parentId') != null ? parent.getParent() : null;
                counter += 1;
            } while ( parent != null );

            return counter;
        },

        /**
         * @return {Number} The order number for a new child
         */
        getOrderForNewChild: function(){
            return this.getChildren().length + 1;
        },

        /**
         * @return {Number} The level based in the parents inNextSynthesis flag
         */
        getSynthesisLevel: function(){
            var counter = 0,
                parent = this;

            do {

                if( parent.get('parentId') !== null ){
                    parent = parent.getParent();
                    if( parent.get('inNextSynthesis') ){
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
            segment.set('idIdea', this.getId());
            this.trigger("change:segments");
        },

        /**
         * Adds a segment as a child
         * @param {Segment} segment
         */
        addSegmentAsChild: function(segment){
            // Cleaning
            delete segment.attributes.highlights;

            var data = {
                shortTitle: segment.get('quote').substr(0, 50),
                longTitle: segment.get('quote'),
                parentId: this.getId(),
                order: this.getOrderForNewChild()
            };

            var onSuccess = function(idea){
                idea.addSegment(segment);
            };

            this.collection.create(data, { success: onSuccess });
        },

        /**
         * @event
         */
        onInNextSynthesisChange: function(){
            var value = this.get('inNextSynthesis');
            this.save({ inNextSynthesis: value });
        },

        /**
         * @event
         */
        onAttrChange: function(){
            this.save();
        },

        /**
         * Updates the order in all children
         */
        updateChildrenOrder: function(){
            var children = _.sortBy(this.getChildren(), function(child){ return child.get('order'); }),
                currentOrder = 1;

            _.each(children, function(child){
                child.set('order', currentOrder);
                child.save();
                currentOrder += 1;
            });
        }

    });

    /**
     * @class IdeaColleciton
     */
    var IdeaCollection = Base.Collection.extend({
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
         * Returns the ideas to compose the synthesis panel
         */
        getInNextSynthesisIdeas: function(){
            var ideas = this.where({inNextSynthesis: true}),
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

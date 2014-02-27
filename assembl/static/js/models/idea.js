define(['models/base','underscore', 'models/segment', 'app', 'i18n', 'types'],
function(Base, _, Segment, app, i18n, Types){
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
            definition: '',
            numChildIdea: 0,
            num_posts: 0,
            num_read_posts: 0,
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
            if (this.get('root') === true) {
                return i18n.gettext('The root idea will not be in the synthesis');
            }

            if( app.stripHtml(this.get('longTitle')) !== '' ){
                return this.get('longTitle');
            } else if ( app.stripHtml(this.get('shortTitle')) !== '' ){
                return this.get('shortTitle');
            } else {
                return i18n.gettext('Add the description');
            }
        },

        /**
         * @return {String} The short Title to be displayed
         */
        getShortTitleDisplayText: function(){
            return this.isRootIdea() ? i18n.gettext('All posts') : this.get('shortTitle');
        },

        /**
         * @return {Boolean} true if the current idea is the root idea
         */
        isRootIdea: function(){
            return this.get('@type') === Types.ROOT_IDEA;
        },

        /**
         * Adds an idea as child
         * @param  {Idea} idea
         */
        addChild: function(idea){
            this.collection.add(idea);

            if( this.isDescendantOf(idea) ){
                this.save('parentId', null);
            }

            idea.save({
                'order':this.getOrderForNewChild(),
                'parentId': this.getId()
            });
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
                if (parent.get('root') === true)
                    break;
                parent = parent.get('parentId') !== null ? parent.getParent() : null;
                counter += 1;
            } while ( parent !== null );

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
            segment.save('idIdea', this.getId());
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
                shortTitle: segment.getQuote().substr(0, 50),
                longTitle: segment.getQuote(),
                parentId: this.getId(),
                order: this.getOrderForNewChild()
            };

            var onSuccess = function(idea){
                idea.addSegment(segment);
            };

            this.collection.create(data, { success: onSuccess });
        },

        /**
         * Updates the order in all children
         */
        updateChildrenOrder: function(){
            var children = _.sortBy(this.getChildren(), function(child){ return child.get('order'); }),
                currentOrder = 1;

            _.each(children, function(child){
                child.save('order', currentOrder);
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
        },

        /**
         * @return {Idea} The root idea
         */
        getRootIdea: function(){
            var retval = this.findWhere({ '@type': Types.ROOT_IDEA });
            if (!retval) {
                console.log("ERROR: getRootIdea() failed!");
                console.log(this);
            }
            return retval;
        },

        /**
         * @return {Idea} The idea which is being edited in synthesis Panel
         */
        getEditingIdeaInSynthesisPanel: function(){
            return app.ideaList.ideas.findWhere({ 'synthesisPanel-editing': true });
        }

    });

    return {
        Model: IdeaModel,
        Collection: IdeaCollection
    };

});

define(['backbone', 'underscore', 'zepto', 'models/idea', 'app'],
function(Backbone, _, $, Idea, app){
    'use strict';

    var DATA_LEVEL = 'data-idealist-level';

    var IdeaView = Backbone.View.extend({
        /**
         * Tag name
         * @type {String}
         */
        tagName: 'li',

        /**
         * The template
         * @type {[type]}
         */
        template: app.loadTemplate('idea'),

        /**
         * The render
         * @return {IdeaView}
         */
        render: function(){
            var data = this.model.toJSON();
            this.el.setAttribute(DATA_LEVEL, data.level);
            this.$el.addClass('idealist-item');

            if( data.level > 1 ){
                this.$el.addClass('is-hidden');
            }

            this.$el.html(this.template(data));

            return this;
        },

        /**
         * Return an array with all children rendered
         * @return {array}
         */
        renderChildren: function(){
            var children = [];
            _.each(this.model.get('children'), function(idea){
                var ideaModel = ( idea.constructor !== Idea.Model ) ? new Idea.Model(idea) : idea,
                    ideaView = new IdeaView({model:ideaModel});

                children.push( ideaView.render().el );
                children = _.union(children, ideaView.renderChildren());
            });

            return children;
        },

        /**
         * add an item as child
         * @param  {string} html
         */
        addChild: function(html){
            if( !this.$el.hasClass('is-open') ){
                this.showItemInCascade( this.$el.next(), this.model.get('level') );
            }

            var idea = new Idea.Model({
                subject: html,
                level: this.model.get('level') + 1
            });

            this.model.addChild(idea);
        },

        /**
         * Shows an item and its descendents
         * @param  {Zepto} item
         * @param  {number} parentLevel
         */
        showItemInCascade: function(item, parentLevel){
            if( item.length === 0 ){
                return;
            }

            var currentLevel = ~~item.attr(DATA_LEVEL);

            if( currentLevel === (parentLevel+1) ){
                item.removeClass("is-hidden");
                this.showItemInCascade(item.next(), parentLevel);
            }
        },

        /**
         * Closes an item and its descendents
         * @param  {Zepto} item
         * @param  {number} parentLevel
         */
        closeItemInCascade: function (item, parentLevel){
            if( item.length === 0 ){
                return;
            }

            var currentLevel = ~~item.attr('data-idealist-level');

            if( currentLevel > parentLevel ){
                item.addClass("is-hidden").removeClass('is-open');
                this.closeItemInCascade(item.next(), parentLevel);
            }
        },

        /**
         * Remove the states related to drag
         */
        clearDragStates: function(){
            this.el.classList.remove('is-dragover');
            this.el.classList.remove('is-dragover-below');
        },

        /**
         * The events
         * @type {Object}
         */
        events: {
            'click [type=checkbox]': 'onCheckboxClick',
            'swipeLeft .idealist-label': 'showOptions',
            'swipeRight .idealist-label': 'hideOptions',
            'click .idealist-label-arrow': 'toggle',
            'dragleave': 'clearDragStates',
            'dragover': 'onDragOver',
            'drop': 'onDrop'
        },

        /**
         * @event
         */
        onDragOver: function(ev){
            ev.preventDefault();
            this.clearDragStates();

            var top = this.el.offsetParent.offsetTop + this.el.offsetTop,
                below = top + 30,
                cls = ev.clientY >= below ? 'is-dragover-below' : 'is-dragover';

            this.el.classList.add( cls );
        },

        /**
         * @event
         */
        onDrop: function(ev){
            ev.stopPropagation();

            this.clearDragStates();
            var li = app.getDraggedSegment();

            this.addChild( li.innerHTML );
        },

        /**
         * Shows the option of an item
         * @event
         * @param  {Event} ev
         */
        showOptions: function(ev){
            $(ev.currentTarget).addClass('is-optioned');
        },

        /**
         * Hide the options of an item
         * @event
         * @param  {Event} ev
         */
        hideOptions: function(ev){
            $(ev.currentTarget).removeClass('is-optioned');
        },

        /**
         * Toggle show/hide an item
         * @event
         * @param  {Event} ev
         */
        toggle: function(ev){
            if( this.$el.hasClass('is-open') ){
                this.$el.removeClass('is-open');
                this.closeItemInCascade( this.$el.next(), ~~this.$el.attr(DATA_LEVEL) );
            } else {
                this.$el.addClass('is-open');
                this.showItemInCascade( this.$el.next(), ~~this.$el.attr(DATA_LEVEL) );
            }
        },

        /**
         * @event
         */
        onCheckboxClick: function(ev){
            var chk = ev.currentTarget;

            if( chk.checked ){
                this.$el.addClass('is-selected');
            } else {
                this.$el.removeClass('is-selected');
            }
        }
    });

    /**
     * States
     */
    IdeaView.prototype.states = {
        hidden: 'is-hidden',
        optioned: 'is-optioned',
        selected: 'is-selected',
        open: 'is-open'
    };

    return IdeaView;
});

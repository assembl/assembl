define(['backbone', 'underscore', 'zepto', 'models/idea', 'app'],
function(Backbone, _, $, Idea, app){
    'use strict';

    var DATA_LEVEL = 'data-idealist-level';

    var IdeaView = Backbone.View.extend({
        /**
         * Tag name
         * @type {String}
         */
        tagName: 'div',

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
            var data = this.model.toJSON(),
                doc = document.createDocumentFragment();

            this.el.setAttribute(DATA_LEVEL, data.level);
            this.$el.addClass('idealist-item');

            if( data.level > 1 ){
                this.$el.addClass('is-hidden');
            }

            if( data.isOpen !== false ){
                this.toggle();
            }

            this.$el.html(this.template(data));
            this.$el.append( this.getRenderedChildren() );

            return this;
        },

        /**
         * Return an array with all children rendered
         * @return {array}
         */
        renderChildren: function(){
            var ret = [],
                children = this.model.get('children'),
                i = 0, len = children.length;

            _.each(children, function(idea, i){
                var ideaModel = ( idea.constructor !== Idea.Model ) ? new Idea.Model(idea) : idea,
                    ideaView = new IdeaView({model:ideaModel});

                ret.push( ideaView.render().el );
                if( ideaModel.get('hasChildren') ){

                    ret = _.union(ret, ideaView.renderChildren());
                }
            });

            return ret;
        },

        /**
         * Returns all children rendered
         * @return {Array<HTMLDivElement>}
         */
        getRenderedChildren: function(){
            var children = this.model.get('children'),
                ret = [];

            _.each(children, function(idea, i){
                var ideaModel = ( idea.constructor !== Idea.Model ) ? new Idea.Model(idea) : idea,
                    ideaView = new IdeaView({model:ideaModel});

                ret.push( ideaView.render().el );
            });

            return ret;
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
            }
            this.showItemInCascade(item.next(), parentLevel);
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

            if( li ){
                this.addChild( 'oi' ); // li.innerText
            }

            if( app.ideaList ){
                app.ideaList.render();
            }
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
                this.model.set('isOpen', false);
                this.$el.removeClass('is-open');
                //this.closeItemInCascade( this.$el.next(), ~~this.$el.attr(DATA_LEVEL) );
            } else {
                this.model.set('isOpen', true);
                this.$el.addClass('is-open');
                //this.showItemInCascade( this.$el.next(), ~~this.$el.attr(DATA_LEVEL) );
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

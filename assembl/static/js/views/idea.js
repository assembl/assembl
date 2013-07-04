define(['backbone', 'underscore', 'zepto', 'models/idea', 'app'],
function(Backbone, _, $, Idea, app){
    'use strict';

    var DATA_LEVEL = 'data-idealist-level',
        PREVIOUS_VALUE = 'previous-value';

    /**
     * Given the .idealist-label, returns the right offsetTop
     * @param  {.idealist-label} el
     * @param  {Number} [top=0] Initial top
     * @return {Number}
     */
    function getTopPosition(el, top){
        top = top || 0;

        if( el.offsetParent.id === 'wrapper' ){
            return top + el.offsetTop;
        } else {
            return getTopPosition(el.offsetParent, el.offsetTop);
        }

    }

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
         * The label element
         * @type {HTMLSpanElement}
         */
        label: null,

        /**
         * The text field
         * @type {HTMLInputElement}
         */
        field: null,

        /**
         * The title element
         * @type {HTMLSpanElement}
         */
        title: null,

        /**
         * The render
         * @return {IdeaView}
         */
        render: function(){
            var data = this.model.toJSON(),
                doc = document.createDocumentFragment();

            this.el.setAttribute(DATA_LEVEL, data.level);
            this.$el.addClass('idealist-item');

            this.$el.html(this.template(data));

            this.label = this.$('.idealist-label').get(0);
            this.title = this.$('.idealist-title').eq(0);

            this.$('.idealist-children').append( this.getRenderedChildren() );

            return this;
        },

        /**
         * Returns all children rendered
         * @return {Array<HTMLDivElement>}
         */
        getRenderedChildren: function(){
            var children = this.model.get('children'),
                ret = [];

            if( this.model.get('hasChildren') === true ){
                _.each(children, function(idea, i){
                    var ideaView = new IdeaView({model:idea});

                    ret.push( ideaView.render().el );
                });
            }

            return ret;
        },

        /**
         * add an item as child
         * @param  {string} html
         */
        addChild: function(html){
            var idea = new Idea.Model({
                subject: html,
                level: this.model.get('level') + 1
            });

            this.model.addChild(idea);
        },

        /**
         * Remove the states related to drag
         */
        clearDragStates: function(){
            this.label.classList.remove('is-dragover');
        },

        /**
         * The events
         * @type {Object}
         */
        events: {
            //'contextmenu': 'onContextMenu',
            'click .idealist-arrow': 'toggle'
            //'dragleave .idealist-label': 'clearDragStates',
            //'dragover .idealist-label': 'onDragOver',
            //'drop .idealist-label': 'onDrop'
        },

        /**
         * @event
         */
        onContextMenu: function(ev){
            if( ev.target.classList.contains('idealist-field') ){
                return;
            }

            var options = {
                'edit': this.startEditTitle
            };

            app.showContextMenu(ev.clientX, ev.clientY, this, options);

            ev.preventDefault();
            ev.stopPropagation();
            return false;
        },


        /**
         * @event
         */
        onDragOver: function(ev){
            if( ev ){
                ev.preventDefault();
                ev.stopPropagation();
            }
            this.clearDragStates();

            this.label.classList.add('is-dragover');
        },

        /**
         * @event
         */
        onDrop: function(ev){
            if( ev ){
                ev.preventDefault();
                ev.stopPropagation();
            }

            this.clearDragStates();

            var li = app.getDraggedSegment();

            var options = {
                'nada': function(){ alert('sim'); }
            };

            if( li ){
                app.showContextMenu(ev.clientX, ev.clientY, this, options);
            }

            // this.addChild( 'oi' ); // li.innerText
            // this.render();
        },

        /**
         * Toggle show/hide an item
         * @event
         * @param  {Event} ev
         */
        toggle: function(ev){
            if( ev ){
                ev.stopPropagation();
            }

            if( this.$el.hasClass('is-open') ){
                this.model.set('isOpen', false);
                this.$el.removeClass('is-open');
            } else {
                this.model.set('isOpen', true);
                this.$el.addClass('is-open');
            }
        },

        /**
         * @event
         */
        onCheckboxClick: function(ev){
            // var chk = ev.currentTarget;

            // if( chk.checked ){
            //     this.$el.addClass('is-selected');
            // } else {
            //     this.$el.removeClass('is-selected');
            // }
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

define(['backbone', 'underscore', 'zepto', 'models/idea', 'models/segment', 'app', 'ckeditor-sharedspace'],
function(Backbone, _, $, Idea, Segment, app, ckeditor){
    'use strict';

    var CKEDITOR_CONFIG = {
        height: '10em',
        toolbar: [  ['Bold', 'Italic', 'Outdent', 'Indent', 'NumberedList', 'BulletedList'] ],
        removePlugins: 'floatingspace,resize'
    };

    var SymthesisIdeaView = Backbone.View.extend({
        /**
         * Tag name
         * @type {String}
         */
        tagName: 'div',

        /**
         * The template
         * @type {[type]}
         */
        template: app.loadTemplate('symthesisIdea'),


        /**
         * CKeditor instance for this view
         * @type {CKeditor}
         */
        ckInstance: null,

        /**
         * @init
         */
        initialize: function(obj){
            if( _.isUndefined(this.model) ){
                this.model = new Idea.Model();
            }

            this.model.on('change:shortTitle change:longTitle change:inSynthesis change:editing', this.render, this);
            var that = this;
            app.on('synthesisPanel:close', function(){
                that.cancelEdition();
            });
        },

        /**
         * The render
         * @return {IdeaView}
         */
        render: function(){
            var data = this.model.toJSON(),
                doc = document.createDocumentFragment();

            this.$el.addClass('idealist-item');
            this.$el.addClass('is-open');

            data.children = []; //this.model.getChildren();
            data.level = this.model.getSynthesisLevel();
            data.editing = this.model.get('editing') || false;

            this.$el.html( this.template(data) );
            this.$('.idealist-children').append( this.getRenderedChildren(data.level) );
            return this;
        },

        /**
         * Returns all children rendered
         * @param {Number} parentLevel 
         * @return {Array<HTMLDivElement>}
         */
        getRenderedChildren: function(parentLevel){
            var children = this.model.getChildren(),
                ret = [];

            _.each(children, function(idea, i){
                if( idea.get('inSynthesis') === true ){
                    idea.set('level', parentLevel + 1);

                    var ideaView = new SymthesisIdeaView({model:idea});
                    ret.push( ideaView.render().el );
                }
            });

            return ret;
        },

        /**
         * Show the childen
         */
        open: function(){
            this.model.set('isOpen', true);
            this.$el.addClass('is-open');
        },

        /**
         * Hide the childen
         */
        close: function(){
            this.model.set('isOpen', false);
            this.$el.removeClass('is-open');
        },

        /**
         * The events
         * @type {Object}
         */
        events: {
            'change [type="checkbox"]': 'onCheckboxChange',

            'click .idealist-arrow': 'toggle',
            'click .idealist-title': 'changeToEditMode',
            'click .idealist-savebtn': 'saveEdition',
            'click .closebutton': 'cancelEdition'
        },

        /**
         * Toggle show/hide an item
         * @event
         * @param  {Event} ev
         */
        toggle: function(ev){
            if( ev ){
                ev.preventDefault();
                ev.stopPropagation();
            }

            if( this.$el.hasClass('is-open') ){
                this.close();
            } else {
                this.open();
            }
        },

        /**
         * @event
         */
        onCheckboxChange: function(ev){
            ev.stopPropagation();
            this.model.set('inSynthesis', ev.currentTarget.checked);
        },

        /**
         * @event
         */
        changeToEditMode: function(ev){
            if( ev ) {
                ev.stopPropagation();
            }
            this.model.set('editing', true);

            this.ckInstance = ckeditor.replace( this.$('.idealist-contenteditable')[0], CKEDITOR_CONFIG );
            this.ckInstance.focus();
        },

        /**
         * @event
         */
        cancelEdition: function(ev){
            if( ev ){
                ev.stopPropagation();
            }
            
            var longTitle = this.model.get('longTitle');
            this.ckInstance.setData(longTitle);

            this.model.set('editing', false);
            this.ckInstance.destroy();
        },

        /**
         * @event
         */
        saveEdition: function(ev){
            if( ev ){
                ev.stopPropagation();
            }

            var data = this.ckInstance.getData();
            this.model.set({ 'longTitle': data, 'editing': false });
            this.ckInstance.destroy();
        }

    });

    return SymthesisIdeaView;
});

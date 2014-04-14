define(['backbone', 'underscore', 'jquery', 'models/idea', 'models/segment', 'app', 'ckeditor-sharedspace'],
function(Backbone, _, $, Idea, Segment, app, ckeditor){
    'use strict';

    var CKEDITOR_CONFIG = _.extend({}, app.CKEDITOR_CONFIG, {
        sharedSpaces: { top: 'synthesisIdea-toptoolbar', bottom: 'synthesisIdea-bottomtoolbar' }
    });

    var SynthesisIdeaView = Backbone.View.extend({
        /**
         * Tag name
         * @type {String}
         */
        tagName: 'div',

        /**
         * The template
         * @type {[type]}
         */
        template: app.loadTemplate('synthesisIdea'),


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

            this.model.on('change:shortTitle change:longTitle change:inNextSynthesis change:editing', this.render, this);
            var that = this;
            app.on('synthesisPanel:close', function(){
                that.cancelEdition();
            });

            app.on('synthesis:startEditing', function(){
                that.cancelEdition();
            });
        },

        /**
         * The render
         * @return {IdeaView}
         */
        render: function(){
            app.trigger('render');
            var model = this.model;

            this.$el.addClass('idealist-item is-open');

            model.set({
                children: [], //this.model.getChildren();
                level: model.getSynthesisLevel(),
                editing: model.get('editing') || false,
                synthesis_expression_text: model.getLongTitleDisplayText()});

            this.$el.html( this.template(model.toJSON()) );
            this.$('.idealist-children').append( this.getRenderedChildren(model.get('level')) );

            if( model.get('editing') === true ){
                var editablearea = this.$('.panel-editablearea')[0],
                    that = this;

                this.ckInstance = ckeditor.inline( editablearea, CKEDITOR_CONFIG );
                editablearea.focus();
                this.ckInstance.element.on('blur', function(){
                    
                    // Firefox triggers the blur event if we paste (ctrl+v)
                    // in the ckeditor, so instead of calling the function direct
                    // we wait to see if the focus is still in the ckeditor
                    setTimeout(function(){
                        if( !that.ckInstance.element ){
                            return;
                        }

                        var hasFocus = document.hasFocus(that.ckInstance.element.$);
                        if( !hasFocus ){
                            that.saveEdition();
                        }
                    }, 100);

                });
            }

            return this;
        },
        

        
        /**
         * Returns all children rendered
         * @param {Number} parentLevel 
         * @return {Array<HTMLDivElement>}
         */
        getRenderedChildren: function(parentLevel){
            var children = this.model.getSynthesisChildren(),
                ret = [];

            _.each(children, function(idea, i){
                idea.set('level', parentLevel + 1);

                var ideaView = new SynthesisIdeaView({model:idea});
                ret.push( ideaView.render().el );
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
            'click .idealist-cancelbtn': 'cancelEdition'
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
            this.model.set('inNextSynthesis', ev.currentTarget.checked);
        },

        /**
         * @event
         */
        changeToEditMode: function(ev){
            if( ev ) {
                ev.stopPropagation();
            }

            app.trigger('synthesis:startEditing');
            this.model.set('editing', true);
        },

        /**
         * @event
         */
        cancelEdition: function(ev){
            if( ev ){
                ev.stopPropagation();
            }

            if( this.model.get('editing') ){
                var longTitle = this.model.get('longTitle');
                this.ckInstance.setData(longTitle);

                this.model.set('editing', false);
                this.ckInstance.destroy();
            }    
        },

        /**
         * @event
         */
        saveEdition: function(ev){
            if( ev ){
                ev.stopPropagation();
            }

            var data = this.ckInstance.getData();
            if(data!=this.model.getLongTitleDisplayText()){
                this.model.set({ 'longTitle': $.trim(data), 'editing': false });
            }
            else {
                this.model.set({ 'editing': false });
            }
            this.ckInstance.destroy();
        }

    });

    return SynthesisIdeaView;
});

define(['backbone', 'underscore', 'jquery', 'app', 'models/synthesis', 'views/synthesisIdeaView', 'ckeditor-sharedspace', 'i18n'],
function(Backbone, _, $, app, Synthesis, SynthesisIdeaView, ckeditor, i18n){
    'use strict';

    var CKEDITOR_CONFIG = _.extend({}, app.CKEDITOR_CONFIG, {
        sharedSpaces: { top: 'synthesisPanel-toptoolbar', bottom: 'synthesisPanel-bottomtoolbar' }
    });

    var SynthesisPanel = Backbone.View.extend({

        /**
         * @init
         */
        initialize: function(obj){
            if( obj ){

                if( obj.button ){
                    this.button = $(obj.button).on('click', app.togglePanel.bind(window, 'synthesisPanel'));
                }

                if( obj.ideas ){
                    this.ideas = obj.ideas;
                } else {
                    this.ideas = new Idea.Collection();
                }
            }

            this.ideas.on('reset', this.render, this);
            this.ideas.on('change', this.render, this);

            this.model.on('reset', this.render, this);
            this.model.on('change', this.render, this);
        },

        /**
         * The model
         * @type {Synthesis}
         */
        model: new Synthesis.Model(),

        /**
         * Flag
         * @type {Boolean}
         */
        collapsed: false,

        /**
         * CKeditor instance for this view
         * @type {CKeditor}
         */
        ckInstance: null,

        /**
         * The template
         * @type {_.template}
         */
        template: app.loadTemplate('synthesisPanel'),

        /**
         * The render
         * @return {SynthesisPanel}
         */
        render: function(){
            app.trigger('render');

            // Cleaning all previous listeners
            app.off('synthesisPanel:close');

            // Cleaning previous ckeditor instance
            if( this.ckinstance ){
                this.ckinstance.destroy();
                this.ckinstance = null;
            }

            var list = document.createDocumentFragment(),
                data = this.model.toJSON(),
                ideas = this.ideas.getInNextSynthesisIdeas();

            data.collapsed = this.collapsed;
            data.ideas = ideas;

            // Getting the scroll position
            var body = this.$('.panel-body'),
                y = body.get(0) ? body.get(0).scrollTop : 0;

            this.$el.html( this.template(data) );

            this.$('.panel-body').get(0).scrollTop = y;

            var editingArea = this.$('#synthesisPanel-ideas [contenteditable]').get(0),
                that = this;

            if( editingArea ){
                this.ckInstance = ckeditor.inline( editingArea, CKEDITOR_CONFIG );
                editingArea.focus();

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
                            that.saveEdition(ev);
                        }
                    }, 100);

                });
            }

            return this;
        },

        /**
         * @events
         */
        events: {
            'blur #synthesisPanel-title': 'onTitleBlur',
            'blur #synthesisPanel-introduction': 'onIntroductionBlur',
            'blur #synthesisPanel-conclusion': 'onConclusionBlur',

            'click #synthesisPanel-closeButton': 'closePanel',
            'click #synthesisPanel-publishButton': 'publish',
            'click #synthesisPanel-fullscreenButton': 'setFullscreen',

            'click [data-idea-id]': 'onEditableAreaClick',
            'click .synthesisPanel-savebtn': 'saveEdition',
            'click .synthesisPanel-cancelbtn': 'cancelEdition'
        },

        /**
         * Blocks the panel
         */
        blockPanel: function(){
            this.$('.panel').addClass('is-loading');
        },

        /**
         * Unblocks the panel
         */
        unblockPanel: function(){
            this.$('.panel').removeClass('is-loading');
        },

        /**
         * Sets the panel as full screen
         */
        setFullscreen: function(){
            app.setFullscreen(this);
        },

        /**
         *
         */
        onTitleBlur: function(ev){
            var title = app.stripHtml(ev.currentTarget.innerHTML);
            this.model.set('subject', title);
        },

        /**
         *
         */
        onIntroductionBlur: function(ev){
            var introduction = app.stripHtml(ev.currentTarget.innerHTML);
            this.model.set("introduction", introduction);
        },

        /**
         *
         */
        onConclusionBlur: function(ev){
            var conclusion = app.stripHtml(ev.currentTarget.innerHTML);
            this.model.set('conclusion', conclusion);
        },

        /**
         * @event
         */
        onEditableAreaClick: function(ev){
            var id = ev.currentTarget.getAttribute('data-idea-id'),
                idea = app.ideaList.ideas.get(id);

            app.trigger('synthesisPanel:edit');

            if( idea ){
                idea.set('synthesisPanel-editing', true);
                this.currentId = id;
            }
        },

        /**
         * @event
         */
        saveEdition: function(ev){
            var id = this.currentId || ev.currentTarget.getAttribute('data-idea-id'),
                idea = app.ideaList.ideas.get(id),
                text = this.ckInstance.getData();

            text = $.trim(text);

            if( idea ){
                idea.set({ 'longTitle': text, 'synthesisPanel-editing': false });
            }
        },

        /**
         * @event
         */
        cancelEdition: function(ev){
            var id = ev.currentTarget.getAttribute('data-idea-id'),
                idea = app.ideaList.ideas.get(id);

            if( idea ){
                idea.set('synthesisPanel-editing', false);
            }            
        },

        /**
         * Closes the panel
         */
        closePanel: function(){
            if(this.button){
                this.button.trigger('click');
            }

            app.trigger('synthesisPanel:close');
        },

        /**
         * Publish the synthesis
         */
        publish: function(){
            var ok = confirm( i18n.gettext("Do you want to publish the synthesis?") );
            if( ok ){
                this._publish();
            }
        },

        /**
         * Publishes the synthesis
         */
        _publish: function(){
            var json = this.model.toJSON(),
                publishes_synthesis_id = this.model.id,
                url = app.getApiUrl('posts'),
                template = app.loadTemplate('synthesisEmail'),
                ideas = this.ideas.getInNextSynthesisIdeas(),
                that = this;

            var onSuccess = function(resp){
                var data = {
                    publishes_synthesis_id: publishes_synthesis_id,
                    subject: app.format(i18n.gettext('[synthesis] {0}'), json.subject),
                    message: template({
                        email: resp[0].most_common_recipient_address,
                        subject: json.subject,
                        introduction: json.introduction,
                        conclusion: json.conclusion,
                        ideas: ideas
                    })
                };

                // Sending the synthesis
                $.ajax({
                    type: "post",
                    data: JSON.stringify(data),
                    contentType: 'application/json',
                    url: url,
                    success: function(){
                        alert( i18n.gettext("Synthesis published!") );
                        that.unblockPanel();
                    }
                });
            };

            // getting the most_common_recipient_address
            $.ajax({
                type: 'get',
                url: app.getApiUrl('sources/'),
                contentType: 'application/json',
                success: onSuccess
            });

            that.blockPanel();
        }
    });


    return SynthesisPanel;

});

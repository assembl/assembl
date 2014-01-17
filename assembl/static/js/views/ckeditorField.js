define(['backbone', 'underscore', 'app', 'ckeditor-sharedspace'], function(Backbone, _, app, ckeditor){
    'use strict';

    var CKEditorField = Backbone.View.extend({
        /**
         * @type {Object}
         */
        attributes: {},

        /**
         * The tempate
         * @type {_.template}
         */
        template: app.loadTemplate('ckeditorField'),

        /**
         * CKeditor instance for this view
         * @type {CKeditor}
         */
        ckInstance: null,

        /**
         * @type {Base.Model}
         */
        model: null,

        /**
         * @type {String}
         */
        modelProp: '',

        /**
         * The text to be shown if the model is empty
         * @type {String}
         */
        placeholder: '',

        /**
         * @init
         */
        initialize: function(obj){
            this.topId = _.uniqueId('ckeditorField-topid');
            this.fieldId = _.uniqueId('ckeditorField');
            this.bottomId = _.uniqueId('ckeditorField-bottomid');

            if( 'modelProp' in obj ){
                this.modelProp = obj.modelProp;
            }

            if( 'placeholder' in obj ){
                this.placeholder = obj.placeholder;
            }

            if( this.model === null ){
                throw new Error('EditableField needs a model');
            }
        },

        /**
         * @return {[type]} [description]
         */
        render: function(editing){
            this.destroy();

            if( _.isUndefined(editing) ){
                editing = false;
            }

            var data = {
                topId: this.topId,
                fieldId: this.fieldId,
                bottomId: this.bottomId,
                text: this.model.get(this.modelProp),
                editing: editing,
                placeholder: this.placeholder
            };

            this.$el.html( this.template(data) );

            if( editing ){
                this.startEditing();
            }

            return this;
        },

        /**
         * set the templace in editing mode
         */
        startEditing: function(){
            var editingArea = this.$('#'+this.fieldId).get(0),
                that = this,
                config = _.extend({}, app.CKEDITOR_CONFIG, {
                    sharedSpaces: { top: this.topId, bottom: this.bottomId }
                });

            this.ckInstance = ckeditor.inline(editingArea, config);
            window.setTimeout(function(){ editingArea.focus(); }, 100);
            this.ckInstance.element.on('blur', function(){

                // Firefox triggers the blur event if we paste (ctrl+v)
                // in the ckeditor, so instead of calling the function directly
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
        },

        /**
         * Renders inside the given jquery or HTML elemenent given
         * @param {jQuery|HTMLElement} el
         * @param {Boolean} editing
         */
        renderTo: function(el, editing){
            $(el).append( this.render(editing).el );
        },

        /**
         * @events
         */
        events: {
            'click .ckeditorField-mainfield': 'changeToEditMode',
            'click .ckeditorField-savebtn': 'saveEdition',
            'click .ckeditorField-cancelbtn': 'cancelEdition'
        },

        /**
         * Destroy the ckeditor instance
         */
        destroy: function(){
            if( this.ckInstance ){
                this.ckInstance.destroy();
            }
        },

        /**
         * @event
         */
        changeToEditMode: function(){
            this.render(true);
        },

        /**
         * @event
         */
        saveEdition: function(ev){
            if( ev ){
                ev.stopPropagation();
            }

            var text = this.ckInstance.getData();
            text = $.trim(text);

            this.model.save(this.modelProp, text);
            this.render(false);
        },

        /**
         * @event
         */
        cancelEdition: function(ev){
            if( ev ){
                ev.stopPropagation();
            }

            if( this.ckInstance ){
                var text = this.model.get(this.modelProp);
                this.ckInstance.setData(text);
            }

            this.render(false);
        },


    });

    return CKEditorField;
});

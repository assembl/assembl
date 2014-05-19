define(['backbone', 'underscore'], function(Backbone, _){
    'use strict';

    var EditableField = Backbone.View.extend({

        /**
         * @type {Object}
         */
        attributes: {},

        /**
         * @type {String}
         */
        tagName: 'div',

        /**
         * @type {BaseModel}
         */
        model: null,

        /**
         * The model's property which will be setted when changed
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
            this.attributes['class'] = 'class' in obj ? obj['class'] : 'panel-editablearea';

            if( !('contenteditable' in this.attributes) ){
                this.attributes['contenteditable'] = true;
            }

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
         * The render
         */
        render: function(){
            var text = this.model.get(this.modelProp);
            this.el.innerHTML = text || this.placeholder;

            return this;
        },

        /**
         * Renders inside the given jquery or HTML elemenent given
         * @param {jQuery|HTMLElement|string} el
         */
        renderTo: function(el){
            $(el).append( this.render().el );
        },

        /**
         * @events
         */
        events: {
            'blur': 'onBlur',
            'keydown': 'onKeyDown'
        },

        /**
         * @event
         */
        onBlur: function(ev){
            var data = app.stripHtml(ev.currentTarget.textContent);
            data = $.trim(data);

            if(data != this.placeholder || data == ''){
                /* we never save placeholder values to the model */
                if(this.model.get(this.modelProp) != data) {
                    /* Nor save to the database and fire change events
                     * if the value didn't change from the model
                     */ 
                    this.model.save(this.modelProp, data);
                }
            }
        },

        /**
         * @event
         */
        onKeyDown: function(ev){
            if( ev.which === 13 || ev.which === 27 ){
                ev.preventDefault();
                $(ev.currentTarget).trigger('blur');
                return false;
            }
        }

    });

    return EditableField;
});

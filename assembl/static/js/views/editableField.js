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

            if( this.model === null ){
                throw new Error('EditableField needs a model');
            }
        },

        /**
         * The render
         */
        render: function(){
            if( this.model ){
                this.el.innerHTML = this.model.get(this.modelProp);
            }

            return this;
        },

        /**
         * Renders inside the given jquery or HTML elemenent given
         * @param {jQuery|HTMLElement} el
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
            var data = $.trim(ev.currentTarget.textContent);
            if( data === '' ){
                data = this.placeholder;
            }

            this.model.save(this.modelProp, data);
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
        },

    });

    return EditableField;
});
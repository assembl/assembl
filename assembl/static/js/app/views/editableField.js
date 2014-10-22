define(function (require) {
    'use strict';

    var Backbone = require('backbone'),
        Ctx = require('app/modules/context');

    var EditableField = Backbone.View.extend({

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
        initialize: function (obj) {
            if ('canEdit' in obj) {
                this.canEdit = obj.canEdit;
            } else {
                this.canEdit = true;
            }

            if ('modelProp' in obj) {
                this.modelProp = obj.modelProp;
            }

            if ('placeholder' in obj) {
                this.placeholder = obj.placeholder;
            }


            if (this.model === null) {
                throw new Error('EditableField needs a model');
            }
        },

        /**
         * The render
         */
        render: function () {
            if (this.canEdit) {
                if (!(this.$el.attr('contenteditable'))) {
                    this.$el.attr('contenteditable', true);
                }
                this.$el.addClass('canEdit panel-editablearea');
            }
            var text = this.model.get(this.modelProp);
            this.el.innerHTML = text || this.placeholder;

            return this;
        },

        /**
         * Renders inside the given jquery or HTML elemenent given
         * @param {jQuery|HTMLElement|string} el
         */
        renderTo: function (el) {
            $(el).append(this.render().el);
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
        onBlur: function (ev) {
            if (this.canEdit) {
                var data = Ctx.stripHtml(ev.currentTarget.textContent);
                data = $.trim(data);

                if (data != this.placeholder || data == '') {
                    /* we never save placeholder values to the model */
                    if (this.model.get(this.modelProp) != data) {
                        /* Nor save to the database and fire change events
                         * if the value didn't change from the model
                         */
                        this.model.save(this.modelProp, data);
                    }
                }
            }
        },

        /**
         * @event
         */
        onKeyDown: function (ev) {
            if (ev.which === 13 || ev.which === 27) {
                ev.preventDefault();
                $(ev.currentTarget).trigger('blur');
                return false;
            }
        }

    });

    return EditableField;
});

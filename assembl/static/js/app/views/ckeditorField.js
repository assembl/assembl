define(function (require) {
    'use strict';

    var Backbone = require('backbone'),
        _ = require('underscore'),
        Ctx = require('app/modules/context'),
        ckeditor = require('ckeditor-sharedspace');


    var CKEditorField = Backbone.View.extend({
        /**
         * @type {Object}
         */
        attributes: {},

        /**
         * The tempate
         * @type {_.template}
         */
        template: Ctx.loadTemplate('ckeditorField'),

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


        showPlaceholderOnEditIfEmpty: false,

        /**
         * Ckeditor default configuration
         * @type {object}
         */
        CKEDITOR_CONFIG: {
            toolbar: [
                ['Bold', 'Italic', 'Outdent', 'Indent', 'NumberedList', 'BulletedList']
            ],
            extraPlugins: 'sharedspace',
            removePlugins: 'floatingspace,resize',
            sharedSpaces: { top: 'ckeditor-toptoolbar', bottom: 'ckeditor-bottomtoolbar' }
        },

        /**
         * @init
         */
        initialize: function (obj) {
            this.topId = _.uniqueId('ckeditorField-topid');
            this.fieldId = _.uniqueId('ckeditorField');
            this.bottomId = _.uniqueId('ckeditorField-bottomid');

            if ('modelProp' in obj) {
                this.modelProp = obj.modelProp;
            }

            if ('placeholder' in obj) {
                this.placeholder = obj.placeholder;
            }

            if ('showPlaceholderOnEditIfEmpty' in obj) {
                this.showPlaceholderOnEditIfEmpty = obj.showPlaceholderOnEditIfEmpty;
            }

            if ('canEdit' in obj) {
                this.canEdit = obj.canEdit;
            } else {
                this.canEdit = true;
            }

            if (this.model === null) {
                throw new Error('EditableField needs a model');
            }
            //console.log(this);
        },

        /**
         * @return {[type]} [description]
         */
        render: function (editing) {
            this.destroy();

            if (_.isUndefined(editing)) {
                editing = false;
            }

            var textToShow = this.showPlaceholderOnEditIfEmpty ? this.placeholder : this.model.get(this.modelProp);
            var data = {
                topId: this.topId,
                fieldId: this.fieldId,
                bottomId: this.bottomId,
                text: textToShow,
                editing: editing,
                canEdit: this.canEdit,
                placeholder: this.placeholder
            };

            this.$el.html(this.template(data));

            if (editing) {
                this.startEditing();
            }

            return this;
        },

        /**
         * set the templace in editing mode
         */
        startEditing: function () {
            var editingArea = this.$('#' + this.fieldId).get(0),
                that = this,
                config = _.extend({}, this.CKEDITOR_CONFIG, {
                    sharedSpaces: { top: this.topId, bottom: this.bottomId }
                });

            this.ckInstance = ckeditor.inline(editingArea, config);
            window.setTimeout(function () {
                editingArea.focus();
            }, 100);
            /*
             We do not enable save on blur, because:
             - we have a Save and a Cancel button
             - the save on blur feature until now was called even when the user clicked on Save or Cancel button, so the content was saved anyway and the buttons were useless
             - an editor may blur by mistake (which saves new content) but maybe he wanted to revert his changes afterwards

             this.ckInstance.element.on('blur', function () {

             // Firefox triggers the blur event if we paste (ctrl+v)
             // in the ckeditor, so instead of calling the function directly
             // we wait to see if the focus is still in the ckeditor
             setTimeout(function () {
             if (!that.ckInstance.element) {
             return;
             }

             var hasFocus = $(that.ckInstance.element).is(":focus");
             if (!hasFocus) {
             that.saveEdition();
             }
             }, 100);

             });
             */
        },

        /**
         * Renders inside the given jquery or HTML elemenent given
         * @param {jQuery|HTMLElement} el
         * @param {Boolean} editing
         */
        renderTo: function (el, editing) {
            $(el).append(this.render(editing).el);
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
        destroy: function () {
            if (this.ckInstance) {
                this.ckInstance.destroy();
            }
        },

        /**
         * @event
         */
        changeToEditMode: function () {
            if (this.canEdit) {
                this.render(true);
            }
        },

        /**
         * @event
         */
        saveEdition: function (ev) {
            if (ev) {
                ev.stopPropagation();
            }

            var text = this.ckInstance.getData();
            text = $.trim(text);
            if (text != this.placeholder || text == '') {
                /* We never save placeholder values to the model */
                if (this.model.get(this.modelProp) != text) {
                    /* Nor save to the database and fire change events
                     * if the value didn't change from the model
                     */
                    this.model.save(this.modelProp, text);
                    this.trigger('save', [this]);
                }
            }
            this.render(false);
        },

        /**
         * @event
         */
        cancelEdition: function (ev) {
            if (ev) {
                ev.stopPropagation();
            }

            if (this.ckInstance) {
                var text = this.model.get(this.modelProp);
                this.ckInstance.setData(text);
            }

            this.render(false);
            this.trigger('cancel', [this]);
        }


    });

    return CKEditorField;
});

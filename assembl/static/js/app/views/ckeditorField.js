'use strict';

var Marionette = require('../shims/marionette.js'),
    _ = require('../shims/underscore.js'),
    $ = require('../shims/jquery.js'),
    Assembl = require('../app.js'),
    Ctx = require('../common/context.js'),
    ckeditor = require('ckeditor-sharedspace');


var cKEditorField = Marionette.ItemView.extend({
    template: '#tmpl-ckeditorField',
    /**
     * Ckeditor default configuration
     * @type {object}
     */
    CKEDITOR_CONFIG: {
        toolbar: [
            ['Bold', 'Italic', 'Outdent', 'Indent', 'NumberedList', 'BulletedList'],
            ['Link', 'Unlink', 'Anchor']
        ],
        extraPlugins: 'sharedspace',
        removePlugins: 'floatingspace,resize',
        sharedSpaces: { top: 'ckeditor-toptoolbar', bottom: 'ckeditor-bottomtoolbar' },
        disableNativeSpellChecker: false,
        title: false //Removes the annoying tooltip in the middle of the main textarea
    },

    ckInstance: null,

    showPlaceholderOnEditIfEmpty: false,

    initialize: function (options) {

        if (this.model === null) {
            throw new Error('EditableField needs a model');
        }

        this.view = this;

        this.topId = _.uniqueId('ckeditorField-topid');
        this.fieldId = _.uniqueId('ckeditorField');
        this.bottomId = _.uniqueId('ckeditorField-bottomid');

        this.autosave = (options.autosave) ? options.autosave : false;

        this.hideButton = (options.hideButton) ? options.hideButton : false;

        this.editing = (this.editing) ? true : false;

        this.modelProp = (options.modelProp) ? options.modelProp : null;

        this.placeholder = (options.placeholder) ? options.placeholder : null;

        this.showPlaceholderOnEditIfEmpty = (options.showPlaceholderOnEditIfEmpty) ? options.showPlaceholderOnEditIfEmpty : null;

        this.canEdit = (options.canEdit) ? options.canEdit : true;

        this.listenTo(this.view, 'cKEditorField:render', this.render);
    },

    ui: {
        mainfield: '.ckeditorField-mainfield',
        saveButton: '.ckeditorField-savebtn',
        cancelButton: '.ckeditorField-cancelbtn'
    },

    events: {
        'click @ui.mainfield': 'changeToEditMode',
        'click @ui.saveButton': 'saveEdition',
        'click @ui.cancelButton': 'cancelEdition'
    },

    serializeData: function () {
        var textToShow = (this.showPlaceholderOnEditIfEmpty) ? this.placeholder : this.model.get(this.modelProp);

        return {
            topId: this.topId,
            fieldId: this.fieldId,
            bottomId: this.bottomId,
            text: textToShow,
            editing: this.editing,
            canEdit: this.canEdit,
            placeholder: this.placeholder,
            hideButton: this.hideButton
        }
    },

    onRender: function () {
        this.destroy();
        if (this.editing) {
            this.startEditing();
        }
    },

    /**
     * set the templace in editing mode
     */
    startEditing: function () {
        var editingArea = this.$('#' + this.fieldId).get(0);
        var that = this;

        var config = _.extend({}, this.CKEDITOR_CONFIG, {
            sharedSpaces: { top: this.topId, bottom: this.bottomId }
        });

        this.ckInstance = ckeditor.inline(editingArea, config);

        setTimeout(function () {
            editingArea.focus();
        }, 100);

        if(this.autosave){

            this.ckInstance.element.on('blur', function () {
                 /**
                 * Firefox triggers the blur event if we paste (ctrl+v)
                 * in the ckeditor, so instead of calling the function directly
                 * we wait to see if the focus is still in the ckeditor
                 */
                 setTimeout(function () {

                     if (!that.ckInstance.element) return;

                     var hasFocus = $(that.ckInstance.element).is(":focus");

                     if (!hasFocus) that.saveEdition();

                 }, 100);

             });
        }
    },

    /**
     * Renders inside the given jquery or HTML elemenent given
     * @param {jQuery|HTMLElement} el
     * @param {Boolean} editing
     */
    renderTo: function (el, editing) {
        this.editing = editing;
        $(el).append(this.$el);
        this.view.trigger('cKEditorField:render');
    },

    /**
     * Destroy the ckeditor instance
     */
    destroy: function () {
        this.ckInstance = null;
    },

    changeToEditMode: function () {
        if (this.canEdit) {
            this.editing = true;
            this.view.trigger('cKEditorField:render');
        }
    },

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
                this.model.save(this.modelProp, text, {
                    success: function (model, resp) {
                    },
                    error: function (model, resp) {
                        console.error('ERROR: saveEdition', resp);
                    }
                });
                this.trigger('save', [this]);
            }
        }
        this.editing = false;
        this.view.trigger('cKEditorField:render');
    },

    cancelEdition: function (ev) {
        if (ev) {
            ev.stopPropagation();
        }

        if (this.ckInstance) {
            var text = this.model.get(this.modelProp);
            this.ckInstance.setData(text);
        }

        this.editing = false;
        this.view.trigger('cKEditorField:render');

        this.trigger('cancel', [this]);
    }

});


module.exports = cKEditorField;

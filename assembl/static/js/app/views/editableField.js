'use strict';

define(['backbone', 'backbone.marionette', 'app', 'common/context', 'underscore'],
    function (Backbone, Marionette, Assembl, Ctx, _) {

        var EditableField = Marionette.ItemView.extend({
            template: _.template(""),
            initialize: function (options) {
                this.view = this;

                (_.has(options, 'canEdit')) ? this.canEdit = options.canEdit : this.canEdit = true;
                (_.has(options, 'modelProp')) ? this.modelProp = options.modelProp : this.modelProp = null;
                (_.has(options, 'placeholder')) ? this.placeholder = options.placeholder : this.placeholder = null;

            if (this.model === null) {
                throw new Error('EditableField needs a model');
            }

                this.listenTo(this.view, 'EditableField:render', this.render);
            },

            events: {
                'blur': 'onBlur',
                'keydown': 'onKeyDown'
            },

            onRender: function () {
            if (this.canEdit) {
                if (!(this.$el.attr('contenteditable'))) {
                    this.$el.attr('contenteditable', true);
                }
                this.$el.addClass('canEdit panel-editablearea');
            }
            var text = this.model.get(this.modelProp);
            this.el.innerHTML = text || this.placeholder;
        },

        /**
         * Renders inside the given jquery or HTML elemenent given
         * @param {jQuery|HTMLElement|string} el
         */
        renderTo: function (el) {
            $(el).append(this.$el);
            this.view.trigger('EditableField:render');
        },

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

define(function (require) {

    var Marionette = require('marionette'),
        panelClassByTypeName = require('objects/viewsFactory'),
        Ctx = require('modules/context'),
        panelSpec = require('models/panelSpec');

    /**
     * A wrapper for a panel, used anywhere in a panelGroup
     */
    var PanelWrapper = Marionette.LayoutView.extend({
        template: "#tmpl-panelWrapper",
        regions: {
            contents: '.panelContents'
        },
        panelType: "groupPanel",
        className: "groupPanel",
        modelEvents: {
            "change:hidden": "setHidden",
            "change:gridWidth": "setGridWidth"
        },
        ui: {
            title: ".panel-header-title"
        },
        events: {
            'click .panel-header-close': 'closePanel'
        },
        initialize: function (options) {
            var contentClass = panelClassByTypeName(options.contentSpec);
            this.contentsView = new contentClass({
                groupContent: options.groupContent,
                panelWrapper: this
            });
            this.model.set('gridWidth', this.contentsView.gridSize || 1);
            Marionette.bindEntityEvents(this, this.model, this.modelEvents);
        },
        serializeData: function () {
            return {
                hideHeader: this.contentsView.hideHeader || false,
                title: this.contentsView.getTitle(),
                tooltip: this.contentsView.tooltip || '',
                headerClass: this.contentsView.headerClass || '',
                userCanChangeUi: Ctx.userCanChangeUi()
            }
        },
        resetTitle: function (newTitle) {
            this.ui.title.html(newTitle);
        },
        /**
         * Closes the panel
         */
        closePanel: function () {
            this.model.collection.remove(this.model);
        },
        onRender: function () {
            this.setGridWidth();
            this.contents.show(this.contentsView);
            this.setHidden();
            Ctx.initTooltips(this.$el);
        },
        setHidden: function () {
            if (this.model.get('hidden')) {
                this.$el.hide();
            } else {
                this.$el.css('display', 'table-cell');
            }
        },
        setGridWidth: function () {
            var gridSize = this.model.get('gridWidth'),
                className = 'panelGridWidth-' + gridSize,
                found = this.$el[0].className.match(/\b(panelGridWidth-[0-9]+)\b/);

            if (found && found[0] != className) {
                this.$el.removeClass(found[0]);
            }
            if ((!found) || found[0] != className) {
                this.$el.addClass(className);
            }
        }
    });
    return PanelWrapper;
});
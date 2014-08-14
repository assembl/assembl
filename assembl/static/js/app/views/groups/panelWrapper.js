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
            'click .panel-header-close': 'onClose',
        },
        initialize: function (options) {
            var that = this,
                contentClass = panelClassByTypeName(options.contentSpec);
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
        /**
         * @event
         */
        onClose: function () {
            this.closePanel();
        },
        onRender: function () {
            this.setGridWidth();
            this.contents.show(this.contentsView);
            this.setHidden();
            Ctx.initTooltips(this.$el);
        },
        setHidden: function() {
            if (this.model.get('hidden')) {
                this.$el.hide();
            } else {
                this.$el.css('display', 'table-cell');
            }
        },
        setGridWidth: function() {
            // Grid width can only be 1 or 2
            this.$el.removeClass("panelGridWidth-"+(3-this.model.get('gridWidth')));
            this.$el.addClass("panelGridWidth-"+this.model.get('gridWidth'));
        }
    });
    return PanelWrapper;
});
define(function (require) {

    var Marionette = require('marionette'),
        ctx = require('modules/context'),
        panelSpec = require('models/panelSpec'),
        AssemblPanel = require('views/assemblPanel'),
        PanelWrapper = require('views/groups/panelWrapper');

    /** Reprents the content of an entire group */
    var groupContent = Marionette.CompositeView.extend({
        template: "#tmpl-groupContent",
        className: "groupContent",
        childViewContainer: ".groupBody",
        childView: PanelWrapper,

        initialize: function (options) {
            var that = this;
            this.collection = this.model.get('panels');
            //this.listenTo(this.collection, 'add remove reset change', this.adjustGridSize);
            setTimeout(function () {
                var navView = that.getViewByTypeName('navSidebar');
                if (navView) {
                    //navView.loadView(that.model.get('navigationState'));
                    navView.toggleMenuByName(that.model.get('navigationState'));
                }
                that.adjustGridSize();
            }, 200);
        },
        events: {
            'click .js_closeGroup': 'closeGroup',
        },
        collectionEvents: {
            'add remove reset change': 'adjustGridSize'
        },

        serializeData: function () {
            return {
                "Ctx": ctx
            };
        },

        closeGroup: function () {
            this.model.collection.remove(this.model);
        },
        calculateGridSize: function () {
            var gridSize = 0;

            _.each(this.collection.models, function (aPanelSpec) {
                if (aPanelSpec.get('hidden'))
                    return;
                gridSize += aPanelSpec.get('gridWidth');
            });
            return gridSize;
        },
        adjustGridSize: function () {
            var gridSize = this.calculateGridSize(),
                className = 'groupGridSize-' + gridSize,
                found = this.$el[0].className.match(/\b(groupGridSize-[0-9]+)\b/);

            if (found && found[0] != className) {
                this.$el.removeClass(found[0]);
            }
            if ((!found) || found[0] != className) {
                this.$el.addClass(className);
                this.model.collection.trigger('change');
            }
        },
        /**
         * Tell the panelWrapper which view to put in its contents
         */
        childViewOptions: function (child, index) {
            return {
                groupContent: this,
                contentSpec: child
            }
        },

        hasNavigation: function () {
            return this.model.getPanelSpecByType('navSidebar') != null;
        },

        resetDebateState: function () {
            if (this.hasNavigation()) {
                this.removePanels('homePanel');
                if (ctx.getCurrentIdea() == undefined) {
                    this.ensurePanelsVisible('messageList');
                    this.ensurePanelsHidden('ideaPanel');
                    this.setPanelWidthByType('messageList',
                        AssemblPanel.prototype.CONTEXT_PANEL_GRID_SIZE); // idea + message
                } else {
                    this.ensurePanelsVisible('ideaPanel', 'messageList');
                    this.setPanelWidthByType('messageList', AssemblPanel.prototype.MESSAGE_PANEL_GRID_SIZE);
                }
            } else {
                // TODO: ensure visible if exists
            }
        },

        setPanelWidthByType: function (panelType, width) {
            var panels = this.model.get('panels');
            var panel = panels.findWhere({'type': panelType});
            panel.set('gridWidth', width);
        },


        /**
         * @params list of panel names
         */
        removePanels: function () {
            this.model.removePanels.apply(this.model, arguments);
        },

        addPanel: function (options, position) {
            this.model.addPanel(options, position);
        },

        ensurePanel: function (options, position) {
            this.model.ensurePanel(options, position);
        },

        getViewByTypeName: function (typeName) {
            var model = this.model.getPanelSpecByType(typeName);
            if (model !== undefined) {
                var view = this.children.findByModel(model);
                if (view == null)
                    return;
                if (view.contents !== undefined) {
                    // wrapper
                    view = view.contents.currentView;
                }
                return view;
            }
        },

        /**
         * @params list of panel names
         */
        ensureOnlyPanelsVisible: function () {
            var that = this,
                args = Array.prototype.slice.call(arguments),
                panels = this.model.get('panels');

            // add missing panels
            this.model.ensurePanelsAt(args, 1);
            // show and hide panels
            _.each(this.model.get('panels').models, function (aPanelSpec) {
                if (aPanelSpec.get('type') == 'navSidebar')
                    return;
                var view = that.children.findByModel(aPanelSpec);
                if (!view)
                    return;
                var shouldBeVisible = _.contains(args, aPanelSpec.get('type'));
                aPanelSpec.set('hidden', !shouldBeVisible);
            });
        },

        /**
         * @params list of panel names
         */
        ensurePanelsVisible: function () {
            var that = this;
            var args = Array.prototype.slice.call(arguments);
            var panels = this.model.get('panels');
            // add missing panels
            this.model.ensurePanelsAt(args, 1);
            // show and hide panels
            _.each(this.model.get('panels').models, function (aPanelSpec) {
                if (aPanelSpec.get('type') == 'navSidebar')
                    return;
                var shouldBeVisible = _.contains(args, aPanelSpec.get('type'));
                if (shouldBeVisible)
                    aPanelSpec.set('hidden', false);
            });
        },

        /**
         * @params list of panel names
         */
        ensurePanelsHidden: function () {
            var that = this;
            var args = Array.prototype.slice.call(arguments);
            var panels = this.model.get('panels');
            // show and hide panels
            _.each(this.model.get('panels').models, function (aPanelSpec) {
                if (aPanelSpec.get('type') == 'navSidebar')
                    return;
                var shouldBeHidden = _.contains(args, aPanelSpec.get('type'));
                if (shouldBeHidden)
                    aPanelSpec.set('hidden', true);
            });
        }
    });

    return groupContent;
});
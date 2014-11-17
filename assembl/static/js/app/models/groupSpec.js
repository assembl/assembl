define(['models/base', 'models/panelSpec'], function (Base, panelSpec) {
    'use strict';

    var GroupSpecModel = Base.Model.extend({
        parse: function (model) {
            model.panels = new panelSpec.Collection(model.panels);
            return model;
        },

        defaults: {
            panels: new panelSpec.Collection([
                {type: 'navSidebar'},
                {type: 'ideaPanel', minimized: true},
                {type: 'messageList'}
            ]),
            navigationState: 'home'
        },

        /**
         * @params list of panel type names
         */
        removePanels: function () {
            var args = Array.prototype.slice.call(arguments);
            var panels = this.get('panels');
            var panelsToRemove = _.filter(panels.models, function (el) {
                return _.contains(args, el.get('type'));
            });
            _.each(panelsToRemove, function (el) {
                panels.remove(el);
            });
        },

        /**
         * @aPanelSpec panelSpec of panel to remove
         */
        removePanelByModel: function (aPanelSpec) {
            this.get('panels').remove(aPanelSpec);
        },

        /**
         * Return the part of the groupSpec that contains the navigation panel
         * (if any)
         */
        getNavigationPanelSpec: function () {
            return this.get('panels').findWhere({type: 'navSidebar'});
        },

        addPanel: function (options, position) {
            var aPanelSpec = new panelSpec.Model(options);
            var panels = this.get('panels');
            if (position === undefined) {
                panels.add(aPanelSpec);
            } else {
                panels.add(aPanelSpec, {at: position});
            }
        },

        getPanelSpecByType: function (typename) {
            return _.find(this.get('panels').models, function (el) {
                return el.get('type') == typename;
            });
        },

        /**
         * @list_of_options panel type name or panelSpec options or array of either
         * @position int order in sequence of panels
         * find or create panels at a given position
         */
        ensurePanelsAt: function (list_of_options, position) {
            if (!Array.isArray(list_of_options)) {
                list_of_options = [list_of_options];
            }
            if (_.any(list_of_options, function (el) {
                return typeof(el) == 'string'
            })) {
                list_of_options = _.map(list_of_options, function (el) {
                    return {type: el};
                });
            }
            var that = this;
            _.each(list_of_options, function (options) {
                if (!that.getPanelSpecByType(options.type)) {
                    that.addPanel(options, position++);
                }
            });
        },
        validate: function (viewsFactory) {
            var panels = this.get('panels');
            return panels.validate(viewsFactory);
        }
    });

    var GroupSpecs = Base.Collection.extend({
        model: GroupSpecModel,
        validate: function (viewsFactory) {
            var invalid = [];
            this.each(function (groupSpec) {
                if (!groupSpec.validate(viewsFactory)) {
                    invalid.push(panelSpec);
                }
            });
            if (invalid.length) {
                this.remove(invalid);
            }
            return (this.length > 0);
        }
    });

    return {
        Model: GroupSpecModel,
        Collection: GroupSpecs
    };

});

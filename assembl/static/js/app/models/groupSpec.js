define(function(require){
    'use strict';

    var Base = require('models/base'),
    panelSpec = require('models/panelSpec');

    var GroupSpecModel = Base.Model.extend({
        parse: function(model) {
            model.panels = new panelSpec.Collection(model.panels);
            return model;
        },

        defaults: {
           locked: false,
           panels: new panelSpec.Collection([
               {type:'navigation'},
               {type:'idea-panel'},
               {type:'message'}
           ]),
           navigationState: 'home'
        },

        /**
         * @params list of panel type names
         */
        removePanels: function(){
          var args = Array.prototype.slice.call(arguments);
          var panels = this.get('panels');
          var panelsToRemove = _.filter ( panels.models, function(el){
            return _.contains(args, el.get('type'));
          } );
          _.each( panelsToRemove, function(el){
            panels.remove(el);
          });
        },

        addPanel: function(options, position) {
          var aPanelSpec = new panelSpec.Model(options);
          var panels = this.get('panels');
          if (position === undefined) {
            panels.add(aPanelSpec);
          } else {
            panels.add(aPanelSpec, {at: position});
          }
        },

        getPanelSpecByType: function(typename) {
          return _.find(this.get('panels').models, function(el) {
            return el.get('type') == typename;
          });
        },

        /**
         * @params panel type name or panelSpec options or array of either
         */
        ensurePanelsAt: function(list_of_options, position) {
          if (!Array.isArray(list_of_options)) {
            list_of_options = [list_of_options];
          }
          if (_.any(list_of_options, function (el) {
              return typeof(el) == 'string'})) {
            list_of_options = _.map(list_of_options, function(el) {return {type: el};});
          }
          var that = this;
          _.each(list_of_options, function(options) {
            if (!that.getPanelSpecByType(options.type)) {
              that.addPanel(options, position);
            }
          });
        }
    });

    var GroupSpecs = Base.Collection.extend({
        model: GroupSpecModel
    });

    return {
        Model: GroupSpecModel,
        Collection: GroupSpecs
    };

});

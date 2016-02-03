'use strict';

var Marionette = require('../shims/marionette.js'),
  $ = require('../shims/jquery.js'),
  _ = require('../shims/underscore.js'),
  CollectionManager = require('../common/collectionManager.js');

/**
 * Generic Breadcrumb ItemView.
 * Must pass a serializer function in order to correctly show the content
 * If not, the passed model will be displayed
 *
 * @param Function  options.serializerFunc  The serializer function taking the passed model and returning a template string
 */
var BreadcrumbItemView = Marionette.ItemView.extend({
// from http://jsfiddle.net/zaSvT/
  
  initialize: function(options){
    this.serializerFunc = options.serializerFunc;
  },

  renderData: function(serialzedModel){
    if (!serialzedModel) { return ""; }

    if (this.serializerFunc) {
      return this.serializerFunc(serialzedModel);
    }

    else {
      return serialzedModel;
    }

    // return (serialzedModel && _.has(serialzedModel, "name")) ? serialzedModel.  
    // return (serialized_model && "name" in serialized_model) ? serialized_model.name : '';
  },
  // 
  template: _.template("<%= entity %>"),

  serializeData: function(){
    return {
      entity: this.renderData(this.model)
    }
  },
  
  className: 'breadcrumb'
});

var BreadcrumbCollectionView = Marionette.CollectionView.extend({
  
  initialize: function(options){
    this.serializerFunc = options.serializerFunc || null;
    this.listenTo(this.collection, 'change', this.render );
    // this.render();
  },

  childView: BreadcrumbItemView,

  // childViewOptions: {
  //   serializerFunc: this.serializerFunc
  // },

  /*
    Override the build of a child view
   */
  buildChildView: function(child, childViewClass, childViewOptions){

    var options = _.extend({model: child}, {
      serializerFunc: this.serializerFunc
    });
    var view = new childViewClass(options);
    return view;
  }
});

/*
This view is meant to be used this way:
var ideaView = new IdeaBreadcrumbFromIdView({
  ideaId: "local:Idea/19"
});
this.$(".idea").html(ideaView.render().el);
*/
// var IdeaBreadcrumbFromIdView = Marionette.ItemView.extend({
//   ideasToShow: [],
//   template: function(serialized_model){
//     return '';
//   },
//   initialize: function(options){
//     var that = this;
//     //if ( !"ideaId" in this.model ){
//     if ( !"ideaId" in options ){
//       console.log("IdeaBreadcrumbFromIdView::initialize() error: no ideaId in this.model");
//       return;
//     }
//     var ideasCollectionPromise = new CollectionManager().getAllIdeasCollectionPromise();
//     Promise.resolve(ideasCollectionPromise).then(function(ideas){
//       var ideaId = options.ideaId; //that.model.ideaId; //"local:Idea/19";
//       that.ideasToShow = [];
//       var fill = function(ideaId){
//         var idea = ideas.get(ideaId);
//         if ( idea ){
//           if ( !idea.isRootIdea() ){
//             that.ideasToShow.push(idea.get('shortTitle'));
//           }
//           if ( idea.get('parentId') ){
//             fill(idea.get('parentId'));
//           }
//         }
//       };
//       fill(ideaId);
//       that.ideasToShow.reverse();
//       that.render();
//     });
//   },
//   onRender: function(){
//     //console.log("IdeaBreadcrumbFromIdView::onRender() this.ideasToShow: ", this.ideasToShow);
//     var a = _.map(this.ideasToShow, function(el){
//       return {
//         "name": el
//       };
//     });
//     var coll = new Backbone.Collection(a);
//     var breadcrumbView = new BreadcrumbCollectionView({
//       collection : coll
//     });
//     this.$el.html(breadcrumbView.render().el);
//   }
// });

/* this was a test 
var IdeaBreadcrumbView = Marionette.ItemView.extend({
  template: function(serialized_model){
    console.log("IdeaBreadcrumbView::template() serialized_model: ", serialized_model);
    var s = '';
    if ( serialized_model ){
      if ( "parentId" in serialized_model ){
        s += serialized_model.parentId + " > ";
      }
      s += ("shortTitle" in serialized_model ) ? serialized_model.shortTitle : "";
    }
    else {
      console.log("IdeaBreadcrumbView::template() error: serialized_model is false: ", serialized_model);
    }
    return s;
  }
});
*/

module.exports = {
  BreadcrumbItemView: BreadcrumbItemView,
  BreadcrumbCollectionView: BreadcrumbCollectionView
};

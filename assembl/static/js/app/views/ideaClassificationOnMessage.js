'use strict';

var Marionette = require('../shims/marionette.js'),
  $ = require('../shims/jquery.js'),
  _ = require('../shims/underscore.js'),
  Assembl = require('../app.js'),
  Ctx = require('../common/context.js'),
  CollectionManager = require('../common/collectionManager.js'),
  Types = require('../utils/types.js'),
  BreadCrumbView = require('./breadcrumb.js'),
  IdeaModel = require('../models/idea.js'),
  i18n = require('../utils/i18n.js'),
  openIdeaInModal = require('./modals/ideaInModal.js'),
  Analytics = require('../internal_modules/analytics/dispatcher.js');

// // root class
// var IdeaShowingMessageModel = Backbone.Model.extend({
//   ideaId: null // string. for example "local:Idea/19"
// });


/**
 * Abstract Class of Idea Classification Views
 */
var IdeaClassificationView = Marionette.LayoutView.extend({
  template: false,
  
  ui: {
    viewIdea: ".js_seeIdea",
    breadcrumbs: ".js_breadcrumb"
  },

  events: {
    'click @ui.viewIdea': 'onSeeIdeaClick'
  },

  regions:{
    breadcrumb: "@ui.breadcrumbs"
  },

  /*
    Must pass the IdeaContentLink model as model to the view (done by Marionette)
    along with the groupContent
   */
  initialize: function(options){
    this._groupContent = options.groupContent;
    this.messageView = options.messageView;
    this.canRender = false;
    var that = this;

    this.model.getUserModelPromise()
      .then(function(user){
        that.user = user;
        return that.model.getIdeaModelPromise();
      })
      .then(function(idea){
        that.idea = idea;
        var ideaAncestry = that.idea.getAncestry();
        that.ideaAncestry = that.createIdeaNameCollection(ideaAncestry);
        return idea.collection.collectionManager.getAllExtractsCollectionPromise();
      })
      .then(function(extracts){

        if (_.isEmpty(extracts)) {
          that.extract = null;
        }
        else {
          //An extract IS an IdeaContentLink type
          that.extract = extracts.get(that.model.get("@id"));
        }
        that.canRender = true;
        that.onEndInitialization();
      })
  },

  /*
    Override in child class in order to add logic once the promises are
    completed in initialization
   */
  onEndInitialization: function(){
  },

  /*
    Override in child class in order to add logic at the end of onRender
   */
  postRender: function(){},

  /*
    The function used by the template to render itself, given it's model
    @return Function  The function that will be returned with parameter for model
   */
  serializerFunc: function(){
    return function(model){
      return model ? model.getShortTitleDisplayText() : "";
    };
  },

  onRender: function(){
    if (this.canRender) {
      
      if (! this.ideaAncestry) {
        throw new Error("Idea Ancestry Collection was undefined on message ", this.model.get('idPost'));
      }

      var IdeaBreadcrumbView = new BreadCrumbView.BreadcrumbCollectionView({
        collection: this.ideaAncestry,
        serializerFunc: this.serializerFunc()
      });

      this.breadcrumb.show(IdeaBreadcrumbView);
      this.postRender();
    }
  },

  /*
    Generates a collection containing the same idea models used in the CollectionManager
   */
  createIdeaNameCollection: function(ideaArray){

    //Create an empty collection and populate it with the models in the Array
    //Shallow copy of the models. Hence, Idea changes should trigger change events on this collection
    //as well
    var col = new IdeaModel.Collection();
    _.each(ideaArray, function(idea){
      col.add(idea); //The order should be maintained
    });

    return col;
  }, 
  

  templateHelpers: function(){
    return {
      i18n: i18n,
      viewIdea: i18n.gettext("View the idea")
    };
  },

  onSeeIdeaClick: function(){
    var analytics = Analytics.getInstance();
    analytics.trackEvent(analytics.events.NAVIGATE_TO_IDEA_IN_IDEA_CLASSIFICATION);

    var panel = this.messageView.messageListView;
    Ctx.clearModal();
    openIdeaInModal(panel, this.idea, true);
  }

});

var DirectMessageView = IdeaClassificationView.extend({
  template: '#tmpl-loader',

  onEndInitialization: function(){
    this.template = '#tmpl-ideaClassification_directMessage';
    this.render(); 
  },

  serializeData: function(){
    if (!this.canRender) {
      return {};
    }

    return {
      author: this.user.get('name')
    }
  }
});

var DirectExtractView = IdeaClassificationView.extend({
  template: '#tmpl-loader',

  onEndInitialization: function(){
    this.template = '#tmpl-ideaClassification_directExtract';
    this.render();
  },

  serializeData: function(){
    if (!this.canRender) {
      return {};
    }

    return {
      harvester: this.user.get('name'),
      extractText: this.extract.getQuote()
    }
  }
});

var IndirectMessageView = IdeaClassificationView.extend({
  template: '#tmpl-loader',

  onEndInitialization: function(){
    this.template = '#tmpl-ideaClassification_indirectMessage';
    this.render();
  },

  serializeData: function(){
    if (!this.canRender){
      return {};
    }

    return {
      threadTitle: this.idea.getShortTitleDisplayText()
    }
  }
});

var IndirectExtractView = IdeaClassificationView.extend({
  template: '#tmpl-loader',

  onEndInitialization: function(){
    this.template = '#tmpl-ideaClassification_indirectExtract';
    this.render(); 
  },

  serializeData: function() {
    if (!this.canRender){
      return {};
    }

    return {
      threadTitle: this.idea.getShortTitleDisplayText(),
      harvester: this.user.get('name'),
      extractText: this.extract.getQuote()
    }
  }
});


var ErrorView = Marionette.ItemView.extend({
  template: _.template("<div><%= i18n.gettext(\"Something went wrong. We're sending our monkeys to look into it.\") %></div>")
});

var IdeaShowingMessageCollectionView = Marionette.CompositeView.extend({
  
  childViewContainer: '.items',
  
  template: '#tmpl-ideaClassification_collection',
  
  initialize: function(options){
    this._groupContent = options.groupContent;
    this.messageView = options.messageView;
  },

  childViewOptions: function(){
    return {
      groupContent: this._groupContent,
      messageView: this.messageView
    }
  },

  getChildView: function(item){

    if (item.isDirect()){
      if (item.get('@type') === Types.IDEA_RELATED_POST_LINK) {
        return DirectMessageView;
      }

      if (item.get('@type') === Types.EXTRACT) {
        return DirectExtractView;
      }
      else {
        return ErrorView;
      }
    }

    else {
      if (item.get('@type') === Types.IDEA_RELATED_POST_LINK) {
        return IndirectMessageView;
      }

      if (item.get('@type') === Types.EXTRACT) {
        return IndirectExtractView;
      }
      else {
        return ErrorView;
      }
    }
  }
});


var IdeasShowingMessageModal = Backbone.Modal.extend({

  template: '#tmpl-ideaClassification_modal',
  className: 'modal-ideas-showing-message popin-wrapper',
  cancelEl: '.close, .js_close',

  initialize: function(options) {
    this.messageView = options.messageView;
    this.messageModel = options.messageModel, 
    this.ideaContentLinks = options.ideaContentLinks;
    this._groupContent = options.groupContent;
  },

  serializeData: function() {
    return {
      i18n: i18n,
      number_of_ideas: this.ideaContentLinks.length
    };
  },

  onRender: function(){
    var IdeaClassificationCollectionView = new IdeaShowingMessageCollectionView({
      collection: this.ideaContentLinks,
      messageView: this.messageView,
      groupContent: this._groupContent
    });

    this.$(".ideas-reasons-collection").html(IdeaClassificationCollectionView.render().el);
  }
});

module.exports = IdeasShowingMessageModal;

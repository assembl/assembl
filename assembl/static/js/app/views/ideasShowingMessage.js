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
  i18n = require('../utils/i18n.js');

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
      i18n: i18n
    };
  },

  onSeeIdeaClick: function(){
    //Add Analytics here
    this._groupContent.setCurrentIdea(this.idea);
    Ctx.clearModal();
  }

});

// var IdeaShowingMessageCollection = Backbone.Collection.extend({
//   model: IdeaShowingMessageModel
// });

// // this is the case where the author of the message has top-posted directly in this idea
// var IdeaShowingMessageBecauseMessagePostedInIdeaModel = IdeaShowingMessageModel.extend({
//   author: null // for now, type is string, but should evolve to User something
// });

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
// var IdeaShowingMessageBecauseMessagePostedInIdeaView = IdeaShowingMessageView.extend({
//   template: '#tmpl-ideaShowingMessageBecauseMessagePostedInIdea'
// });

// // this is the case where a harvester harvested an extract of this message and put it into this idea
// var IdeaShowingMessageBecauseMessageHarvestedInIdeaModel = IdeaShowingMessageModel.extend({
//   harvester: null, // for now, type is string, but should evolve to User something
//   extractText: null // type is string, could evolve to Extract something
// });

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

// var IdeaShowingMessageBecauseMessageHarvestedInIdeaView = IdeaShowingMessageView.extend({
//   template: '#tmpl-ideaShowingMessageBecauseMessageHarvestedInIdea'
// });

// // this is the case where the message is an answer in a discussion thread, and the first message of the thread was posted into this idea
// var IdeaShowingMessageBecauseMessageAncestorPostedInIdeaModel = IdeaShowingMessageModel.extend({
//   threadTitle: null // type is string, could evolve to Post something
// });

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

// var IdeaShowingMessageBecauseMessageAncestorPostedInIdeaView = IdeaShowingMessageView.extend({
//   template: '#tmpl-ideaShowingMessageBecauseMessageAncestorPostedInIdea'
// });

// // this is the case where the message is an answer in a discussion thread, and one of its ancestors has been harvested into this idea
// // maybe we could also provide a link to the harvested message? or show its author?
// var IdeaShowingMessageBecauseMessageAncestorHarvestedInIdeaModel = IdeaShowingMessageModel.extend({
//   threadTitle: null, // type is string, could evolve to Post something
//   harvester: null, // for now, type is string, but should evolve to User something
//   extractText: null // type is string, could evolve to Extract something
// });

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

// var IdeaShowingMessageBecauseMessageAncestorHarvestedInIdeaView = IdeaShowingMessageView.extend({
//   template: '#tmpl-ideaShowingMessageBecauseMessageAncestorHarvestedInIdea'
// });

var IdeaShowingMessageCollectionView = Marionette.CompositeView.extend({
  
  childViewContainer: '.items',
  
  template: '#tmpl-ideaClassification_collection',
  
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

    // if ( item instanceof IdeaShowingMessageBecauseMessagePostedInIdeaModel ){
    //   return IdeaShowingMessageBecauseMessagePostedInIdeaView;
    // }
    // if ( item instanceof IdeaShowingMessageBecauseMessageHarvestedInIdeaModel ){
    //   return IdeaShowingMessageBecauseMessageHarvestedInIdeaView;
    // }
    // if ( item instanceof IdeaShowingMessageBecauseMessageAncestorPostedInIdeaModel ){
    //   return IdeaShowingMessageBecauseMessageAncestorPostedInIdeaView;
    // }
    // if ( item instanceof IdeaShowingMessageBecauseMessageAncestorHarvestedInIdeaModel ){
    //   return IdeaShowingMessageBecauseMessageAncestorHarvestedInIdeaView;
    // }

    // console.log("!!!! error fallback");
    // return IdeaShowingMessageBecauseMessagePostedInIdeaView; // TODO: better error fallback
  }
});


var IdeasShowingMessageModal = Backbone.Modal.extend({
  // template: _.template($('#tmpl-ideasShowingMessage').html()),
  template: '#tmpl-ideaClassification_modal',

  className: 'modal-ideas-showing-message popin-wrapper',

  cancelEl: '.close, .js_close',

  initialize: function(options) {
    this.messageView = options.parentView;
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
      collection: this.ideaContentLinks
    });

    this.$(".ideas-reasons-collection").html(IdeaClassificationCollectionView.render().el);    

    // var that = this;
    // var ideasCollectionPromise = new CollectionManager().getAllIdeasCollectionPromise();
    // Promise.resolve(ideasCollectionPromise).then(function(ideas){
    //   var ideaId = "local:Idea/189";
    //   var idea = ideas.get(ideaId);
    //   if ( idea ){
    //     var d0 = new IdeaShowingMessageBecauseMessagePostedInIdeaModel({
    //       author: "Testy Tester",
    //       ideaId: ideaId //idea
    //     });

    //     var d1 = new IdeaShowingMessageBecauseMessageHarvestedInIdeaModel({
    //       harvester: "Testy Harvester",
    //       ideaId: ideaId,
    //       extractText: "But I must explain to you how all this mistaken idea of denouncing pleasure and praising pain was born and I will give you a complete account of the system, and expound the actual teachings of the great explorer of the truth, the master-builder of human happiness. No one rejects, dislikes, or avoids pleasure itself, because it is pleasure, but because those who do not know how to pursue pleasure rationally encounter consequences that are extremely painful. Nor again is there anyone who loves or pursues or desires to obtain pain of itself, because it is pain, but because occasionally circumstances occur in which toil and pain can procure him some great pleasure. To take a trivial example, which of us ever undertakes laborious physical exercise, except to obtain some advantage from it? But who has any right to find fault with a man who chooses to enjoy a pleasure that has no annoying consequences, or one who avoids a pain that produces no resultant pleasure?"
    //     });

    //     var d2 = new IdeaShowingMessageBecauseMessageAncestorPostedInIdeaModel({
    //       threadTitle: "Great thread!!",
    //       ideaId: ideaId
    //     });

    //     var d3 = new IdeaShowingMessageBecauseMessageAncestorHarvestedInIdeaModel({
    //       threadTitle: "Great thread!!",
    //       harvester: "Testy Harvester",
    //       extractText: "En général, ce serait une grande folie d'espérer que ceux qui dans le fait sont les maîtres préfèreront un autre intérêt au leur. - Jean-Jacques Rousseau, Sur l'économie politique (1755)",
    //       ideaId: ideaId
    //     });

    //     var d4 = new IdeaShowingMessageBecauseMessageAncestorPostedInIdeaModel({
    //       threadTitle: "Great thread!!",
    //       ideaId: ideaId
    //     });

    //     var d5 = new IdeaShowingMessageBecauseMessageAncestorPostedInIdeaModel({
    //       threadTitle: "Great thread!!",
    //       ideaId: ideaId
    //     });

    //     var d6 = new IdeaShowingMessageBecauseMessageAncestorPostedInIdeaModel({
    //       threadTitle: "Great thread!!",
    //       ideaId: ideaId
    //     });

    //     var data = [d0, d1, d2, d3, d4, d5, d6];

    //     var myIdeaReasons = new IdeaShowingMessageCollection(data);

    //     var ideasColl = new IdeaShowingMessageCollectionView({
    //       collection: myIdeaReasons
    //     });

    //     that.$(".ideas-reasons-collection").html(ideasColl.render().el);
    //   }
    //   else {
    //     console.log("error: idea not found: ", ideaId);
    //   }
    // });
  }
});

module.exports = IdeasShowingMessageModal;

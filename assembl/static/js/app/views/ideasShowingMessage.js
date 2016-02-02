'use strict';

var Marionette = require('../shims/marionette.js'),
  $ = require('../shims/jquery.js'),
  _ = require('../shims/underscore.js'),
  Assembl = require('../app.js'),
  Ctx = require('../common/context.js'),
  CollectionManager = require('../common/collectionManager.js'),
  IdeaBreadcrumbFromIdView = require('./ideaBreadcrumb.js'),
  i18n = require('../utils/i18n.js');

// root class
var IdeaShowingMessageModel = Backbone.Model.extend({
  ideaId: null // string. for example "local:Idea/19"
});

// root class, ~ abstract: only sub-classes should be instanciated. Sub-classes have in common to render the breadcrumb of an idea associated to the message
var IdeaShowingMessageView = Marionette.ItemView.extend({
  template: false,
  events: {
    'click .js_seeIdea': 'onSeeIdeaClick'
  },
  onRender: function(){
    var ideaView = new IdeaBreadcrumbFromIdView({
      ideaId: this.model.get('ideaId')
    });
    this.$(".idea").html(ideaView.render().el);
  },
  templateHelpers: function(){
    return {
      i18n: i18n
    };
  },
  onSeeIdeaClick: function(){
    var that = this;
    new CollectionManager().getAllIdeasCollectionPromise().then(function(allIdeasCollection) {
      var ideaId = that.model.get('ideaId');
      if ( "modal_instance" in window && "_groupContent" in window.modal_instance ){
        window.modal_instance.destroy();
        window.modal_instance._groupContent.setCurrentIdea(
          allIdeasCollection.get(ideaId),
          "from_ideasShowingMessage"
        );
      }
    });
  }
});

var IdeaShowingMessageCollection = Backbone.Collection.extend({
  model: IdeaShowingMessageModel
});

// this is the case where the author of the message has top-posted directly in this idea
var IdeaShowingMessageBecauseMessagePostedInIdeaModel = IdeaShowingMessageModel.extend({
  author: null // for now, type is string, but should evolve to User something
});

var IdeaShowingMessageBecauseMessagePostedInIdeaView = IdeaShowingMessageView.extend({
  template: '#tmpl-ideaShowingMessageBecauseMessagePostedInIdea'
});

// this is the case where a harvester harvested an extract of this message and put it into this idea
var IdeaShowingMessageBecauseMessageHarvestedInIdeaModel = IdeaShowingMessageModel.extend({
  harvester: null, // for now, type is string, but should evolve to User something
  extractText: null // type is string, could evolve to Extract something
});

var IdeaShowingMessageBecauseMessageHarvestedInIdeaView = IdeaShowingMessageView.extend({
  template: '#tmpl-ideaShowingMessageBecauseMessageHarvestedInIdea'
});

// this is the case where the message is an answer in a discussion thread, and the first message of the thread was posted into this idea
var IdeaShowingMessageBecauseMessageAncestorPostedInIdeaModel = IdeaShowingMessageModel.extend({
  threadTitle: null // type is string, could evolve to Post something
});

var IdeaShowingMessageBecauseMessageAncestorPostedInIdeaView = IdeaShowingMessageView.extend({
  template: '#tmpl-ideaShowingMessageBecauseMessageAncestorPostedInIdea'
});

// this is the case where the message is an answer in a discussion thread, and one of its ancestors has been harvested into this idea
// maybe we could also provide a link to the harvested message? or show its author?
var IdeaShowingMessageBecauseMessageAncestorHarvestedInIdeaModel = IdeaShowingMessageModel.extend({
  threadTitle: null, // type is string, could evolve to Post something
  harvester: null, // for now, type is string, but should evolve to User something
  extractText: null // type is string, could evolve to Extract something
});

var IdeaShowingMessageBecauseMessageAncestorHarvestedInIdeaView = IdeaShowingMessageView.extend({
  template: '#tmpl-ideaShowingMessageBecauseMessageAncestorHarvestedInIdea'
});

var IdeaShowingMessageCollectionView = Marionette.CompositeView.extend({
  childViewContainer: '.items',
  template: '#tmpl-ideaShowingMessageCollection',
  getChildView: function(item){
    if ( item instanceof IdeaShowingMessageBecauseMessagePostedInIdeaModel ){
      return IdeaShowingMessageBecauseMessagePostedInIdeaView;
    }
    if ( item instanceof IdeaShowingMessageBecauseMessageHarvestedInIdeaModel ){
      return IdeaShowingMessageBecauseMessageHarvestedInIdeaView;
    }
    if ( item instanceof IdeaShowingMessageBecauseMessageAncestorPostedInIdeaModel ){
      return IdeaShowingMessageBecauseMessageAncestorPostedInIdeaView;
    }
    if ( item instanceof IdeaShowingMessageBecauseMessageAncestorHarvestedInIdeaModel ){
      return IdeaShowingMessageBecauseMessageAncestorHarvestedInIdeaView;
    }

    console.log("!!!! error fallback");
    return IdeaShowingMessageBecauseMessagePostedInIdeaView; // TODO: better error fallback
  }
});

var IdeasShowingMessageModal = Backbone.Modal.extend({
  template: _.template($('#tmpl-ideasShowingMessage').html()),
  className: 'modal-ideas-showing-message popin-wrapper',
  cancelEl: '.close, .js_close',
  initialize: function(options) {
    this._groupContent = ("groupContent" in options) ? options.groupContent : null;
    window.modal_instance = this;
  },
  serializeData: function() {
    return {
      i18n: i18n,
      number_of_ideas: 6
    };
  },
  onRender: function(){
    var that = this;
    var ideasCollectionPromise = new CollectionManager().getAllIdeasCollectionPromise();
    Promise.resolve(ideasCollectionPromise).then(function(ideas){
      var ideaId = "local:Idea/189";
      var idea = ideas.get(ideaId);
      if ( idea ){
        var d0 = new IdeaShowingMessageBecauseMessagePostedInIdeaModel({
          author: "Testy Tester",
          ideaId: ideaId //idea
        });

        var d1 = new IdeaShowingMessageBecauseMessageHarvestedInIdeaModel({
          harvester: "Testy Harvester",
          ideaId: ideaId,
          extractText: "But I must explain to you how all this mistaken idea of denouncing pleasure and praising pain was born and I will give you a complete account of the system, and expound the actual teachings of the great explorer of the truth, the master-builder of human happiness. No one rejects, dislikes, or avoids pleasure itself, because it is pleasure, but because those who do not know how to pursue pleasure rationally encounter consequences that are extremely painful. Nor again is there anyone who loves or pursues or desires to obtain pain of itself, because it is pain, but because occasionally circumstances occur in which toil and pain can procure him some great pleasure. To take a trivial example, which of us ever undertakes laborious physical exercise, except to obtain some advantage from it? But who has any right to find fault with a man who chooses to enjoy a pleasure that has no annoying consequences, or one who avoids a pain that produces no resultant pleasure?"
        });

        var d2 = new IdeaShowingMessageBecauseMessageAncestorPostedInIdeaModel({
          threadTitle: "Great thread!!",
          ideaId: ideaId
        });

        var d3 = new IdeaShowingMessageBecauseMessageAncestorHarvestedInIdeaModel({
          threadTitle: "Great thread!!",
          harvester: "Testy Harvester",
          extractText: "En général, ce serait une grande folie d'espérer que ceux qui dans le fait sont les maîtres préfèreront un autre intérêt au leur. - Jean-Jacques Rousseau, Sur l'économie politique (1755)",
          ideaId: ideaId
        });

        var d4 = new IdeaShowingMessageBecauseMessageAncestorPostedInIdeaModel({
          threadTitle: "Great thread!!",
          ideaId: ideaId
        });

        var d5 = new IdeaShowingMessageBecauseMessageAncestorPostedInIdeaModel({
          threadTitle: "Great thread!!",
          ideaId: ideaId
        });

        var d6 = new IdeaShowingMessageBecauseMessageAncestorPostedInIdeaModel({
          threadTitle: "Great thread!!",
          ideaId: ideaId
        });

        var data = [d0, d1, d2, d3, d4, d5, d6];

        var myIdeaReasons = new IdeaShowingMessageCollection(data);

        var ideasColl = new IdeaShowingMessageCollectionView({
          collection: myIdeaReasons
        });

        that.$(".ideas-reasons-collection").html(ideasColl.render().el);
      }
      else {
        console.log("error: idea not found: ", ideaId);
      }
    });
  }
});

module.exports = IdeasShowingMessageModal;

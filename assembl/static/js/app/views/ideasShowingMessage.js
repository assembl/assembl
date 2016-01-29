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

// root class, only sub-classes should be instanciated. Sub-classes have in common to render the breadcrumb of an idea associated to the message
var IdeaShowingMessageView = Marionette.ItemView.extend({
  template: false,
  onRender: function(){
    var ideaView = new IdeaBreadcrumbFromIdView({
      ideaId: this.model.get('ideaId')
    });
    this.$(".idea").html(ideaView.render().el);
  }
});

var IdeaShowingMessageCollection = Backbone.Collection.extend({
  model: IdeaShowingMessageModel
});

var IdeaShowingMessageBecauseMessagePostedInIdeaModel = IdeaShowingMessageModel.extend({
  author: null // for now, type is string, but should evolve to User something
});

var IdeaShowingMessageBecauseMessagePostedInIdeaView = IdeaShowingMessageView.extend({
  template: '#tmpl-ideaShowingMessageBecauseMessagePostedInIdea'
});

var IdeaShowingMessageBecauseMessageHarvestedInIdeaModel = IdeaShowingMessageModel.extend({
  harvester: null, // for now, type is string, but should evolve to User something
  extractText: null // type is string, could evolve to Extract something
});

var IdeaShowingMessageBecauseMessageHarvestedInIdeaView = IdeaShowingMessageView.extend({
  template: '#tmpl-ideaShowingMessageBecauseMessageHarvestedInIdea'
});

var IdeaShowingMessageBecauseMessageAncestorRelatedToIdeaModel = IdeaShowingMessageModel.extend({
  threadTitle: null // type is string, could evolve to Post something
});

var IdeaShowingMessageBecauseMessageAncestorRelatedToIdeaView = IdeaShowingMessageView.extend({
  template: '#tmpl-ideaShowingMessageBecauseMessageAncestorRelatedToIdea'
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
    if ( item instanceof IdeaShowingMessageBecauseMessageAncestorRelatedToIdeaModel ){
      return IdeaShowingMessageBecauseMessageAncestorRelatedToIdeaView;
    }

    console.log("!!!! error fallback");
    return IdeaShowingMessageBecauseMessagePostedInIdeaView; // TODO: better error fallback
  }
});

var IdeasShowingMessageModal = Backbone.Modal.extend({
  template: _.template($('#tmpl-ideasShowingMessage').html()),
  className: 'partner-modal popin-wrapper',
  cancelEl: '.close, .js_close',
  initialize: function() {
    this.$('.bbm-modal').addClass('popin');
  },
  serializeData: function() {
    return {
      number_of_ideas: 6
    };
  },
  onRender: function(){
    var that = this;
    var ideasCollectionPromise = new CollectionManager().getAllIdeasCollectionPromise();
    Promise.resolve(ideasCollectionPromise).then(function(ideas){
      var ideaId = "local:Idea/19";
      var idea = ideas.get(ideaId);
      if ( idea ){
        var d0 = new IdeaShowingMessageBecauseMessagePostedInIdeaModel({
          author: "Testy Tester",
          ideaId: ideaId //idea
        });

        var d1 = new IdeaShowingMessageBecauseMessageHarvestedInIdeaModel({
          harvester: "Testy Harvester",
          ideaId: ideaId,
          extractText: "Coucou"
        });

        var d2 = new IdeaShowingMessageBecauseMessageAncestorRelatedToIdeaModel({
          threadTitle: "Great thread!!",
          ideaId: ideaId
        });

        var data = [d0, d1, d2];

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

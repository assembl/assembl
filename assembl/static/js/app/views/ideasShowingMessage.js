'use strict';

var Marionette = require('../shims/marionette.js'),
  $ = require('../shims/jquery.js'),
  _ = require('../shims/underscore.js'),
  Assembl = require('../app.js'),
  Ctx = require('../common/context.js'),
  i18n = require('../utils/i18n.js');

// root class
var IdeaShowingMessageModel = Backbone.Model.extend({
  idea: null // for now, type is string, but should evolve to Idea
});

var IdeaShowingMessageCollection = Backbone.Collection.extend({
  model: IdeaShowingMessageModel
});

var IdeaShowingMessageBecauseMessagePostedInIdeaModel = IdeaShowingMessageModel.extend({
  author: null // for now, type is string, but should evolve to User something
});

var IdeaShowingMessageBecauseMessagePostedInIdeaView = Marionette.ItemView.extend({
  template: '#tmpl-ideaShowingMessageBecauseMessagePostedInIdea'
});

var IdeaShowingMessageBecauseMessageHarvestedInIdeaModel = IdeaShowingMessageModel.extend({
  harvester: null, // for now, type is string, but should evolve to User something
  extractText: null // type is string, could evolve to Extract something
});

var IdeaShowingMessageBecauseMessageHarvestedInIdeaView = Marionette.ItemView.extend({
  template: '#tmpl-ideaShowingMessageBecauseMessageHarvestedInIdea'
});

var IdeaShowingMessageBecauseMessageAncestorRelatedToIdeaModel = IdeaShowingMessageModel.extend({
  threadTitle: null // type is string, could evolve to Post something
});

var IdeaShowingMessageBecauseMessageAncestorRelatedToIdeaView = Marionette.ItemView.extend({
  template: '#tmpl-ideaShowingMessageBecauseMessageAncestorRelatedToIdea'
});

var IdeaShowingMessageCollectionView = Marionette.CompositeView.extend({
  childViewContainer: '.items',
  template: '#tmpl-ideaShowingMessageCollection',
  getChildView: function(item){
    console.log("IdeaShowingMessageCollectionView::getChildView() item: ", item);

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

    var d0 = new IdeaShowingMessageBecauseMessagePostedInIdeaModel({
      author: "Testy Tester",
      idea: "local:Idea/5"
    });

    var d1 = new IdeaShowingMessageBecauseMessageHarvestedInIdeaModel({
      harvester: "Testy Harvester",
      idea: "local:Idea/5",
      extractText: "Coucou"
    });

    var d2 = new IdeaShowingMessageBecauseMessageAncestorRelatedToIdeaModel({
      threadTitle: "Great thread!!",
      idea: "local:Idea/5"
    });

    var data = [d0, d1, d2];

    var myIdeaReasons = new IdeaShowingMessageCollection(data);

    var ideasColl = new IdeaShowingMessageCollectionView({
      collection: myIdeaReasons
    });

    console.log("ideasColl: ", ideasColl);
    console.log("ideasColl.render().el: ", ideasColl.render().el);

    this.$(".ideas-reasons-collection").html(ideasColl.render().el);
  }
});

module.exports = IdeasShowingMessageModal;

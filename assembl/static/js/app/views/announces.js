'use strict';

var Marionette = require('../shims/marionette.js'),
    _ = require('../shims/underscore.js'),
    $ = require('../shims/jquery.js'),
    i18n = require('../utils/i18n.js'),
    Assembl = require('../app.js'),
    Ctx = require('../common/context.js'),
    Types = require('../utils/types.js'),
    Announce = require('../models/announce.js'),
    AgentViews = require('./agent.js'),
    EditableField = require('./reusableDataFields/editableField.js'),
    CKEditorField = require('./reusableDataFields/ckeditorField.js'),
    TrueFalseField = require('./reusableDataFields/trueFalseField.js');

/** 
 */
var AbstractAnnounceView = Marionette.LayoutView.extend({

  initialize: function(options) {
  },

  events: {

  },

  onRender: function() {
    Ctx.removeCurrentlyDisplayedTooltips(this.$el);
    Ctx.initTooltips(this.$el);
  },

  regions: {
    region_title: ".js_announce_title_region",
    region_body: ".js_announce_body_region",
    region_shouldPropagateDown: ".js_announce_shouldPropagateDown_region"
  },

  modelEvents: {
    'change': 'render'
  }
});


var AnnounceView = AbstractAnnounceView.extend({
  template: '#tmpl-announce',

  className: 'attachment'
});

var AnnounceMessageView = AbstractAnnounceView.extend({
  template: '#tmpl-loader',


  attributes: {
    "class": "announceMessage bx"
  },

  regions: {
    authorAvatarRegion: ".js_author_avatar_region",
    authorNameRegion: ".js_author_name_region"
  },

  modelEvents: {
    'change':'render'
  },

  serializeData: function() {
    var retval = this.model.toJSON();
    retval.creator = this.creator;
    retval.ctx = Ctx;
    return retval;
  },

  initialize: function(options) {
    var that = this;

    this.creator = undefined;
    this.model.getCreatorPromise().then(function(creator) {
      if(!that.isViewDestroyed()) {
        that.creator = creator;
        that.template = '#tmpl-announceMessage';
        that.render();
      }
    });
  },

  onRender: function() {
    AbstractAnnounceView.prototype.onRender.call(this);

    if (this.template === '#tmpl-announceMessage') {
      this.renderCreator();
    }
  },

  renderCreator: function() {
    var agentAvatarView = new AgentViews.AgentAvatarView({
      model: this.creator,
      avatarSize: 50
    });
    this.authorAvatarRegion.show(agentAvatarView);
    var agentNameView = new AgentViews.AgentNameView({
      model: this.creator
    });
    this.authorNameRegion.show(agentNameView);
  },
});

var AnnounceEditableView = AbstractAnnounceView.extend({
  template: '#tmpl-announceEditable',

  className: 'announceEditable',
  
  events:_.extend({}, AbstractAnnounceView.prototype.events, {
    'click .js_announce_delete': 'onDeleteButtonClick' //Dynamically rendered, do NOT use @ui
  }),
  
  onRender: function() {
    AbstractAnnounceView.prototype.onRender.call(this);

    var titleView = new EditableField({
      'model': this.model,
      'modelProp': 'title'
    });
    this.region_title.show(titleView);

    var bodyView = new CKEditorField({
      'model': this.model,
      'modelProp': 'body'
    });
    this.region_body.show(bodyView);

    var shouldPropagateDownView = new TrueFalseField({
      'model': this.model,
      'modelProp': 'should_propagate_down'
    });
    this.region_shouldPropagateDown.show(shouldPropagateDownView);
    
  },

  onDeleteButtonClick: function(ev) {
    this.model.destroy();
  },
});

var AnnounceListEmptyEditableView = Marionette.ItemView.extend({
  template: "#tmpl-announceListEmptyEditable",
  ui: {
    'addAnnounceButton': '.js_announceAddButton'
  },
  events: {
    'click @ui.addAnnounceButton': 'onAddAnnounceButtonClick',
  },
  initialize: function(options) {
    console.log(options);
    this.objectAttachedTo = options.objectAttachedTo;
    this.collection = options.collection;
  },
  onAddAnnounceButtonClick: function(ev) {
    var announce = new Announce.Model({
      '@type': Types.IDEA_ANNOUNCE,
      creator: Ctx.getCurrentUser().id,
      last_updated_by: Ctx.getCurrentUser().id,
      idObjectAttachedTo: this.objectAttachedTo.id,
      should_propagate_down: true
      }
    );
    this.collection.add(announce);
    announce.save();
  },
});

var AnnounceEditableCollectionView = Marionette.CollectionView.extend({
  initialize: function(options) {
    this.objectAttachedTo = options.objectAttachedTo;
  },
  childView: AnnounceEditableView,
  emptyView: AnnounceListEmptyEditableView,
  childViewOptions:  function(model, index) {
    return {
      objectAttachedTo: this.objectAttachedTo,
      collection: this.collection
    }
  }
});

module.exports = module.exports = {
    AnnounceEditableView: AnnounceEditableView,
    AnnounceMessageView: AnnounceMessageView,
    AnnounceEditableCollectionView: AnnounceEditableCollectionView
  };

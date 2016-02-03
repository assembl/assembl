'use strict';

var Marionette = require('../shims/marionette.js'),
    _ = require('../shims/underscore.js'),
    $ = require('../shims/jquery.js'),
    i18n = require('../utils/i18n.js'),
    Assembl = require('../app.js'),
    Ctx = require('../common/context.js'),
    Types = require('../utils/types.js'),
    Announcement = require('../models/announcement.js'),
    AgentViews = require('./agent.js'),
    EditableField = require('./reusableDataFields/editableField.js'),
    CKEditorField = require('./reusableDataFields/ckeditorField.js'),
    TrueFalseField = require('./reusableDataFields/trueFalseField.js');

/** 
 */
var AbstractAnnouncementView = Marionette.LayoutView.extend({

  initialize: function(options) {
  },

  events: {

  },

  onRender: function() {
    Ctx.removeCurrentlyDisplayedTooltips(this.$el);
    Ctx.initTooltips(this.$el);
  },

  regions: {
    region_title: ".js_announcement_title_region",
    region_body: ".js_announcement_body_region",
    region_shouldPropagateDown: ".js_announcement_shouldPropagateDown_region"
  },

  modelEvents: {
    'change': 'render'
  }
});


var AnnouncementView = AbstractAnnouncementView.extend({
  template: '#tmpl-announcement',

  className: 'attachment'
});

var AnnouncementMessageView = AbstractAnnouncementView.extend({
  template: '#tmpl-loader',


  attributes: {
    "class": "announcementMessage bx"
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
        that.template = '#tmpl-announcementMessage';
        that.render();
      }
    });
  },

  onRender: function() {
    AbstractAnnouncementView.prototype.onRender.call(this);

    if (this.template === '#tmpl-announcementMessage') {
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

var AnnouncementEditableView = AbstractAnnouncementView.extend({
  template: '#tmpl-announcementEditable',

  className: 'announcementEditable',
  
  events:_.extend({}, AbstractAnnouncementView.prototype.events, {
    'click .js_announcement_delete': 'onDeleteButtonClick' //Dynamically rendered, do NOT use @ui
  }),
  
  onRender: function() {
    AbstractAnnouncementView.prototype.onRender.call(this);

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

var AnnouncementListEmptyEditableView = Marionette.ItemView.extend({
  template: "#tmpl-announcementListEmptyEditable",
  ui: {
    'addAnnouncementButton': '.js_announcementAddButton'
  },
  events: {
    'click @ui.addAnnouncementButton': 'onAddAnnouncementButtonClick',
  },
  initialize: function(options) {
    //console.log(options);
    this.objectAttachedTo = options.objectAttachedTo;
    this.collection = options.collection;
  },
  onAddAnnouncementButtonClick: function(ev) {
    var announcement = new Announcement.Model({
      '@type': Types.IDEA_ANNOUNCEMENT,
      creator: Ctx.getCurrentUser().id,
      last_updated_by: Ctx.getCurrentUser().id,
      idObjectAttachedTo: this.objectAttachedTo.id,
      should_propagate_down: true
      }
    );
    this.collection.add(announcement);
    announcement.save();
  },
});

var AnnouncementEditableCollectionView = Marionette.CollectionView.extend({
  initialize: function(options) {
    this.objectAttachedTo = options.objectAttachedTo;
  },
  childView: AnnouncementEditableView,
  emptyView: AnnouncementListEmptyEditableView,
  childViewOptions:  function(model, index) {
    return {
      objectAttachedTo: this.objectAttachedTo,
      collection: this.collection
    }
  }
});

module.exports = module.exports = {
    AnnouncementEditableView: AnnouncementEditableView,
    AnnouncementMessageView: AnnouncementMessageView,
    AnnouncementEditableCollectionView: AnnouncementEditableCollectionView
  };

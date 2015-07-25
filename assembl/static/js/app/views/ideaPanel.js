'use strict';

var Assembl = require('../app.js'),
    Ctx = require('../common/context.js'),
    i18n = require('../utils/i18n.js'),
    EditableField = require('./editableField.js'),
    CKEditorField = require('./ckeditorField.js'),
    Permissions = require('../utils/permissions.js'),
    PanelSpecTypes = require('../utils/panelSpecTypes.js'),
    MessageSendView = require('./messageSend.js'),
    MessagesInProgress = require('../objects/messagesInProgress.js'),
    Notification = require('./notification.js'),
    SegmentList = require('./segmentList.js'),
    IdeaWidgets = require('./ideaWidgets.js'),
    CollectionManager = require('../common/collectionManager.js'),
    AssemblPanel = require('./assemblPanel.js'),
    Marionette = require('../shims/marionette.js'),
    $ = require('../shims/jquery.js'),
    _ = require('../shims/underscore.js'),
    Promise = require('bluebird');

var IdeaPanel = AssemblPanel.extend({
  template: '#tmpl-ideaPanel',
  panelType: PanelSpecTypes.IDEA_PANEL,
  className: 'ideaPanel',
  minimizeable: true,
  closeable: false,
  gridSize: AssemblPanel.prototype.IDEA_PANEL_GRID_SIZE,
  minWidth: 270,
  regions: {
    segmentList: ".postitlist",
    widgetsInteraction: ".ideaPanel-section-widgets"
  },
  initialize: function(options) {
    Object.getPrototypeOf(Object.getPrototypeOf(this)).initialize.apply(this, arguments);
    var that = this;
    this.panelWrapper = options.panelWrapper;
    this.editingDefinition = false;
    this.editingTitle = false;

    if (!this.model) {
      this.model = this.getGroupState().get('currentIdea');
    }

    this.listenTo(this.getGroupState(), "change:currentIdea", function(state, currentIdea) {
          if (!this.isViewDestroyed()) {
            that.setIdeaModel(currentIdea);
          }
        });

    this.listenTo(Assembl.vent, 'DEPRECATEDideaPanel:showSegment', function(segment) {
      that.showSegment(segment);
    });

    if (this.model) {
      //This is a silly hack to go through setIdeaModel properly - benoitg
      var model = this.model;
      this.model = null;
      this.setIdeaModel(model);
    }
  },
  ui: {
    'postIt': '.postitlist',
    'definition': '.js_editDefinition',
    'longTitle': '.js_editLongTitle',
    'seeMoreOrLess': '.js_seeMoreOrLess',
    'seeLess': '.js_seeLess',
    'deleteIdea': '.js_ideaPanel-deleteBtn',
    'clearIdea': '.js_ideaPanel-clearBtn',
    'closeExtract': '.js_closeExtract'
  },
  modelEvents: {
    //Do NOT listen to change here
    //'replacedBy': 'onReplaced',
    'change': 'render'
  },
  events: {
    'dragstart .bx.postit': 'onDragStart',
    'dragend .bx.postit': "onDragEnd",
    'dragover': 'onDragOver',
    'dragleave': 'onDragLeave',
    'drop': 'onDrop',
    'click @ui.closeExtract': 'onSegmentCloseButtonClick',
    'click @ui.clearIdea': 'onClearAllClick',
    'click @ui.deleteIdea': 'onDeleteButtonClick',
    'click @ui.seeMoreOrLess': 'seeMoreContent',
    'click @ui.seeLess': 'seeLessContent',
    'click @ui.definition': 'editDefinition',
    'click @ui.longTitle': 'editTitle',
    'click .js_openTargetInPopOver': 'openTargetInPopOver'
  },

  getTitle: function() {
    return i18n.gettext('Idea');
  },

  tooltip: i18n.gettext('Detailled information about the currently selected idea in the Table of ideas'),

  /**
   * This is not inside the template because babel wouldn't extract it in
   * the pot file
   */
  getSubIdeasLabel: function(subIdeas) {
    if (subIdeas.length == 0) {
      return i18n.gettext('This idea has no sub-ideas');
    }
    else {
      return i18n.sprintf(i18n.ngettext('This idea has %d sub-idea', 'This idea has %d sub-ideas', subIdeas.length), subIdeas.length);
    }
  },
  /**
   * This is not inside the template because babel wouldn't extract it in
   * the pot file
   */
  getExtractsLabel: function() {
    var len = 0;

    if (this.extractListSubset) {
      len = this.extractListSubset.models.length;
    }

    if (len == 0) {
      if (Ctx.getCurrentUser().can(Permissions.ADD_EXTRACT)) {
        return i18n.gettext('No extract was harvested');
      }
      else {
        return i18n.gettext('No important nugget was harvested');
      }
    }
    else {
      if (Ctx.getCurrentUser().can(Permissions.ADD_EXTRACT)) {
        return i18n.sprintf(i18n.ngettext('%d extract was harvested', '%d extracts were harvested', len), len);
      }
      else {
        return i18n.sprintf(i18n.ngettext('%d important nugget was harvested', '%d important nuggets were harvested', len), len);
      }
    }
  },

  renderTemplateGetExtractsLabel: function() {
    this.$('.ideaPanel-section-segments-legend .legend').html(
        this.getExtractsLabel());
  },

  serializeData: function() {
    if (Ctx.debugRender) {
      console.log("ideaPanel::serializeData()");
    }

    var subIdeas = {},
        currentUser = Ctx.getCurrentUser(),
        canEdit = currentUser.can(Permissions.EDIT_IDEA) || false,
        canEditNextSynthesis = currentUser.can(Permissions.EDIT_SYNTHESIS),
        contributors = null,
        direct_link_relative_url = null,
        share_link_url = null;

    if (this.model) {
      subIdeas = this.model.getChildren();
      contributors = this.model.get('contributors');

      direct_link_relative_url = Ctx.getRelativeURLFromDiscussionRelativeURL("idea/" + encodeURIComponent(this.model.get('@id')));

      //share_link_url = "/static/js/bower/expando/add/index.htm?u=" +
      share_link_url = "/static/widget/share/index.html?u=" +
          encodeURIComponent(Ctx.getAbsoluteURLFromRelativeURL(direct_link_relative_url)) + "&t=" +
          encodeURIComponent(this.model.get('shortTitle'));
    }

    return {
      idea: this.model,
      contributors: contributors,
      subIdeas: subIdeas,
      canEdit: canEdit,
      i18n: i18n,
      getExtractsLabel: this.getExtractsLabel,
      getSubIdeasLabel: this.getSubIdeasLabel,
      canDelete: currentUser.can(Permissions.EDIT_IDEA),
      canEditNextSynthesis: canEditNextSynthesis,
      canEditExtracts: currentUser.can(Permissions.EDIT_EXTRACT),
      canEditMyExtracts: currentUser.can(Permissions.EDIT_MY_EXTRACT),
      canAddExtracts: currentUser.can(Permissions.EDIT_EXTRACT), //TODO: This is a bit too coarse
      Ctx: Ctx,
      editingDefinition: this.editingDefinition,
      editingTitle: this.editingTitle,
      direct_link_relative_url: direct_link_relative_url,
      share_link_url: share_link_url
    };

  },

  onRender: function() {
    var that = this;

    if (Ctx.debugRender) {
      console.log("ideaPanel::onRender()");
    }

    Ctx.removeCurrentlyDisplayedTooltips(this.$el);

    Ctx.initTooltips(this.$el);

    if (this.model && this.model.id  && this.extractListSubset) {
      //Only fetch extracts if idea already has an id.
      //console.log(this.extractListSubset);
      // display only important extract for simple user
      if (!Ctx.getCurrentUser().can(Permissions.ADD_EXTRACT)) {
        this.extractListSubset.models = _.filter(this.extractListSubset.models, function(model) {
          return model.get('important');
        });
      }

      this.getExtractslist();

      this.displayEditableFields();

      if (this.editingDefinition) {
        this.renderCKEditorDescription();
      }

      if (this.editingTitle) {
        this.renderCKEditorLongTitle();
      }

      setTimeout(function() {
        that.ellipsis('.ideaPanel-definition', that.ui.seeMoreOrLess);
      }, 0);

      var ideaWidgets = new IdeaWidgets({model: this.model});
      this.widgetsInteraction.show(ideaWidgets);
    }

  },

  getExtractslist: function() {
    var that = this,
        collectionManager = new CollectionManager();

    if (this.extractListSubset) {
      Promise.join(collectionManager.getAllExtractsCollectionPromise(),
                  collectionManager.getAllUsersCollectionPromise(),
                  collectionManager.getAllMessageStructureCollectionPromise(),
                function(allExtractsCollection, allUsersCollection, allMessagesCollection) {

                  that.extractListView = new SegmentList.SegmentListView({
                    collection: that.extractListSubset,
                    allUsersCollection: allUsersCollection,
                    allMessagesCollection: allMessagesCollection
                  });

                  that.getRegion('segmentList').show(that.extractListView);
                  that.renderTemplateGetExtractsLabel();
                });
    } else {
      this.renderTemplateGetExtractsLabel();
    }
  },

  displayEditableFields: function() {

    var currentUser = Ctx.getCurrentUser(),
        canEdit = currentUser.can(Permissions.EDIT_IDEA) || false,
        modelId = this.model.id,
        partialMessage = MessagesInProgress.getMessage(modelId);

    var shortTitleField = new EditableField({
      'model': this.model,
      'modelProp': 'shortTitle',
      'class': 'panel-editablearea text-bold',
      'data-tooltip': i18n.gettext('Short expression (only a few words) of the idea in the table of ideas.'),
      'placeholder': i18n.gettext('New idea'),
      'canEdit': canEdit,
      'focus': this.focusShortTitle
    });
    shortTitleField.renderTo(this.$('#ideaPanel-shorttitle'));

    var commentView = new MessageSendView({
      'allow_setting_subject': false,
      'reply_idea': this.model,
      'body_help_message': i18n.gettext('Comment on this idea here...'),
      'send_button_label': i18n.gettext('Send your comment'),
      'subject_label': null,
      'msg_in_progress_body': partialMessage['body'],
      'msg_in_progress_ctx': modelId,
      'mandatory_body_missing_msg': i18n.gettext('You need to type a comment first...'),
      'mandatory_subject_missing_msg': null,
      'enable_button': false

      //TODO:  Pass the messageListView that is expected to refresh with the new comment
    });
    this.$('#ideaPanel-comment').html(commentView.render().el);

  },

  /**
   * Add a segment
   * @param  {Segment} segment
   */
  addSegment: function(segment) {
    delete segment.attributes.highlights;

    var id = this.model.getId(),
        that = this;
    segment.save('idIdea', id, {
      success: function(model, resp) {
        //console.log('SUCCESS: addSegment', resp);
        that.extractListView.render();
      },
      error: function(model, resp) {
        console.error('ERROR: addSegment', resp);
      }
    });
  },

  /**
   * Shows the given segment with an small fx
   * @param {Segment} segment
   */
  showSegment: function(segment) {
    var that = this,
        selector = Ctx.format('.box[data-segmentid={0}]', segment.cid),
        idIdea = segment.get('idIdea'),
        box,
        collectionManager = new CollectionManager();

    collectionManager.getAllIdeasCollectionPromise()
            .then(function(allIdeasCollection) {
              var idea = allIdeasCollection.get(idIdea);
              if (!idea) {
                return;
              }

              that.setIdeaModel(idea);
              box = that.$(selector);

              if (box.length) {
                var panelBody = that.$('.panel-body');
                var panelOffset = panelBody.offset().top;
                var offset = box.offset().top;

                // Scrolling to the element
                var target = offset - panelOffset + panelBody.scrollTop();
                panelBody.animate({ scrollTop: target });
                box.highlight();
              }
            }

        );
  },

  onReplaced: function(newObject) {
    if (this.model !== null) {
      this.stopListening(this.model, 'replacedBy acquiredId');
    }

    this.setIdeaModel(newObject);
  },

  /**
   * Set the given idea as the current one
   * @param  {Idea} [idea=null]
   */
  setIdeaModel: function(idea, reason) {
      var that = this;
      if (reason === "created") {
        this.focusShortTitle = true;
      }
      else {
        this.focusShortTitle = false;
      }

      //console.log("setIdeaModel called with", idea.id, reason);
      if (idea !== this.model) {
        if (this.model !== null) {
          this.stopListening(this.model);
        }

        this.model = idea;
        this.editingDefinition = false;
        this.editingTitle = false;

        //console.log("this.extractListSubset before setIdea:", this.extractListSubset);
        if (this.extractListSubset) {
          this.stopListening(this.extractListSubset);
          this.extractListSubset = null;
        }

        if (this.extractListView) {
          this.extractListView.unbind();
          this.extractListView = null;
        }

        if (this.model) {
          //this.resetView();
          //console.log("setIdeaModel:  we have a model ")
          this.template = '#tmpl-loader';
          if (this.isViewRenderedAndNotYetDestroyed) {
            this.panelWrapper.unminimizePanel();
            if (!this.model.id) {
              //console.log("setIdeaModel:  we have a model, but no id ")
              this.render();

              this.listenTo(this.model, 'acquiredId', function(m) {
                // model has acquired an ID. Reset everything.
                if (!this.isViewDestroyed()) {
                  var model = that.model;
                  that.model = null;
                  that.setIdeaModel(model, reason);
                }
              });
            }
            else {
              //console.log("setIdeaModel:  we have a model, and an id ")
              this.fetchModelAndRender();
            }
          }
        } 
        else {
          //TODO: More sophisticated behaviour here, depending
          //on if the panel was opened by selection, or by something else.
          //If we don't call render here, the panel will not refresh if we delete an idea.
          if (this.isViewRenderedAndNotYetDestroyed) {
            this.template = '#tmpl-ideaPanel';
            this.panelWrapper.minimizePanel();
            this.render();
          }
        }
      }
    },

  fetchModelAndRender: function() {
      var that = this,
      collectionManager = new CollectionManager(),
      fetchPromise = this.model.fetch({ data: $.param({ view: 'contributors'}) });
      Promise.join(collectionManager.getAllExtractsCollectionPromise(), fetchPromise,
          function(allExtractsCollection, fetchedJQHR) {
            //View could be gone, or model may have changed in the meantime
            if (that.isViewRenderedAndNotYetDestroyed() && that.model) {
              that.extractListSubset = new SegmentList.IdeaSegmentListSubset([], {
                parent: allExtractsCollection,
                ideaId: that.model.id
              });
              that.listenTo(that.extractListSubset, "add remove reset change", that.renderTemplateGetExtractsLabel);

              //console.log("The region:", that.segmentList);
              that.template = '#tmpl-ideaPanel';
              that.render();
            }
          }

      );
    },

  deleteCurrentIdea: function() {
    // to be deleted, an idea cannot have any children nor segments
    var that = this,
        children = this.model.getChildren();

    this.blockPanel();
    this.model.getExtractsPromise()
            .then(function(ideaExtracts) {

              that.unblockPanel();
              if (children.length > 0) {
                that.unblockPanel();
                alert(i18n.gettext('You cannot delete an idea while it has sub-ideas.'));
              }

              // Nor has any segments
              else if (ideaExtracts.length > 0) {
                that.unblockPanel();
                console.log(ideaExtracts);
                alert(i18n.gettext('You cannot delete an idea associated to extracts.'));
              }
              else if (that.model.get('num_posts') > 0) {
                that.unblockPanel();
                alert(i18n.gettext('You cannot delete an idea associated to comments.'));
              }
              else {
                // That's a bingo
                var ok = confirm(i18n.gettext('Confirm that you want to delete this idea.'));

                if (ok) {
                  that.model.destroy({
                    success: function() {
                      that.unblockPanel();
                      that.getContainingGroup().setCurrentIdea(null);
                    },
                    error: function(model, resp) {
                      console.error('ERROR: deleteCurrentIdea', resp);
                    }
                  });
                }
                else {
                  that.unblockPanel();
                }
              }
            });
  },

  onDragStart: function(ev) {
    if (ev) {
      ev.stopPropagation();
    }

    var that = this,
        collectionManager = new CollectionManager();

    //TODO: Deal with editing own extract (EDIT_MY_EXTRACT)
    if (Ctx.getCurrentUser().can(Permissions.EDIT_EXTRACT)) {
      collectionManager.getAllExtractsCollectionPromise()
            .then(function(allExtractsCollection) {
              ev.currentTarget.style.opacity = 0.4;

              ev.originalEvent.dataTransfer.effectAllowed = 'move';
              ev.originalEvent.dataTransfer.dropEffect = 'all';

              var cid = ev.currentTarget.getAttribute('data-segmentid'),
                  segment = allExtractsCollection.getByCid(cid);

              Ctx.showDragbox(ev, segment.getQuote());
              Ctx.setDraggedSegment(segment);

            });
    }
  },

  onDragEnd: function(ev) {
    if (ev) {
      ev.preventDefault();
      ev.stopPropagation();
    }

    this.$el.removeClass('is-dragover');
    ev.currentTarget.style.opacity = 1;
    Ctx.setDraggedSegment(null);

  },

  onDragOver: function(ev) {
    if (ev) {
      ev.preventDefault();
      ev.stopPropagation();
    }

    if (ev.originalEvent) {
      ev = ev.originalEvent;
    }

    ev.dataTransfer.dropEffect = 'all';

    if (Ctx.getDraggedSegment() !== null || Ctx.getDraggedAnnotation() !== null) {
      this.$el.addClass("is-dragover");
    }
  },

  onDragLeave: function(ev) {
    if (ev) {
      ev.preventDefault();
      ev.stopPropagation();
    }

    this.$el.removeClass('is-dragover');
  },

  onDrop: function(ev) {
    //console.log("ideaPanel:onDrop() fired");
    if (ev) {
      ev.preventDefault();
      ev.stopPropagation();
    }

    this.$el.removeClass('is-dragover');

    this.$el.trigger('dragleave');

    var segment = Ctx.getDraggedSegment();

    if (segment) {
      this.addSegment(segment);
      Ctx.setDraggedSegment(null);
    }

    var annotation = Ctx.getDraggedAnnotation();

    if (annotation) {
      // Add as a segment
      Ctx.currentAnnotationIdIdea = this.model.getId();
      Ctx.currentAnnotationNewIdeaParentIdea = null;
      Ctx.saveCurrentAnnotationAsExtract();
    }

    this.extractListView.render();

    return;
  },

  onSegmentCloseButtonClick: function(ev) {
    var cid = ev.currentTarget.getAttribute('data-segmentid'),
        collectionManager = new CollectionManager();
    collectionManager.getAllExtractsCollectionPromise().done(
            function(allExtractsCollection) {
              var segment = allExtractsCollection.get(cid);

              if (segment) {
                segment.save('idIdea', null);
              }
            });
  },

  onClearAllClick: function(ev) {
    var ok = confirm(i18n.gettext('Confirm that you want to send all extracts back to the clipboard.'));
    if (ok) {
      // Clone first, because the operation removes extracts from the subset.
      var models = _.clone(this.extractListSubset.models)
      _.each(models, function(extract) {
        extract.set('idIdea', null);
      });
      _.each(models, function(extract) {
        extract.save();
      });
    }
  },

  onDeleteButtonClick: function() {
    this.deleteCurrentIdea();
  },

  seeMoreOrLess: function(e) {
    e.preventDefault();

    var elm = $(e.target),
        seeMore = this.$('.seeMore'),
        seeLess = this.$('.seeLess'),
        lessContent = this.$('.lesscontent'),
        hideContent = this.$('.morecontent');

    if (elm.hasClass('seeMore')) {
      hideContent.removeClass('hidden');
      seeMore.addClass('hidden');
      seeLess.removeClass('hidden');
      lessContent.addClass('hidden');
    }

    if (elm.hasClass('seeLess')) {
      hideContent.addClass('hidden');
      seeMore.removeClass('hidden');
      seeLess.addClass('hidden');
      lessContent.removeClass('hidden');
    }
  },

  ellipsis: function(sectionSelector, seemoreUi) {
    /* We use https://github.com/MilesOkeefe/jQuery.dotdotdot to show
     * Read More links for introduction preview
     */
     
    $(sectionSelector).dotdotdot({
      after: seemoreUi,
      height: 170,
      callback: function(isTruncated, orgContent) {

        if (isTruncated) {

          //seemoreUi.removeClass('hidden');

        }
        else {
          //seemoreUi.hide();
        }
      },
      watch: "window"
    });

  },

  seeMoreContent: function(e) {
    e.stopPropagation();
    e.preventDefault();

    $(".ideaPanel-definition").trigger('destroy');

    this.ui.seeLess.removeClass('hidden');
  },

  seeLessContent: function(e) {
    e.stopPropagation();
    e.preventDefault();

    this.ui.seeLess.addClass('hidden');

    this.ellipsis('.ideaPanel-definition', this.ui.seeMoreOrLess);
  },

  editDefinition: function() {
    if (Ctx.getCurrentUser().can(Permissions.EDIT_IDEA)) {
      this.editingDefinition = true;
      this.render();
    }
  },

  editTitle: function() {
    if (Ctx.getCurrentUser().can(Permissions.EDIT_IDEA)) {
      this.editingTitle = true;
      this.render();
    }
  },

  renderCKEditorDescription: function() {
    var that = this,
        area = this.$('.ideaPanel-definition-editor');

    var model = this.model.getDefinitionDisplayText();

    if (!model.length) return;

    var description = new CKEditorField({
      'model': this.model,
      'modelProp': 'definition'
    });

    this.listenTo(description, 'save cancel', function() {
      that.editingDefinition = false;
      that.render();
    });

    description.renderTo(area);
    description.changeToEditMode();
  },

  renderCKEditorLongTitle: function() {
    var that = this,
        area = this.$('.ideaPanel-longtitle-editor');

    var model = this.model.getLongTitleDisplayText();

    if (!model.length) return;

    var ckeditor = new CKEditorField({
      'model': this.model,
      'modelProp': 'longTitle'
    });

    this.listenTo(ckeditor, 'save cancel', function() {
      that.editingTitle = false;
      that.render();
    });

    ckeditor.renderTo(area);
    ckeditor.changeToEditMode();
  },

  openTargetInPopOver: function(evt) {
    console.log("ideaPanel openTargetInPopOver(evt: ", evt);
    return Ctx.openTargetInPopOver(evt);
  }

});

module.exports = IdeaPanel;

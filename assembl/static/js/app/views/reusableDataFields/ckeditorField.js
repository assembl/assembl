'use strict';

var Marionette = require('../../shims/marionette.js'),
    _ = require('../../shims/underscore.js'),
    $ = require('../../shims/jquery.js'),
    Assembl = require('../../app.js'),
    Ctx = require('../../common/context.js');

var cKEditorField = Marionette.ItemView.extend({
  constructor: function cKEditorField() {
    Marionette.ItemView.apply(this, arguments);
  },

  template: '#tmpl-ckeditorField',
  /**
   * Ckeditor default configuration
   * @type {object}
   */
  CKEDITOR_CONFIG: {
    toolbar: [
        ['Bold', 'Italic', 'Outdent', 'Indent', 'NumberedList', 'BulletedList'],
        ['Link', 'Unlink', 'Anchor']
    ],
    extraPlugins: 'sharedspace',
    removePlugins: 'floatingspace,resize',
    sharedSpaces: { top: 'ckeditor-toptoolbar', bottom: 'ckeditor-bottomtoolbar' },
    disableNativeSpellChecker: false,
    title: false //Removes the annoying tooltip in the middle of the main textarea
  },

  ckInstance: null,

  showPlaceholderOnEditIfEmpty: false,

  initialize: function(options) {

    if (this.model === null) {
      throw new Error('EditableField needs a model');
    }
    //console.log("cKEditorField options: ", options);

    this.view = this;

    this.topId = _.uniqueId('ckeditorField-topid');
    this.fieldId = _.uniqueId('ckeditorField');
    this.bottomId = _.uniqueId('ckeditorField-bottomid');

    this.autosave = (options.autosave) ? options.autosave : false;

    this.hideButton = (options.hideButton) ? options.hideButton : false;

    this.editing = (this.editing) ? true : false;

    this.modelProp = (options.modelProp) ? options.modelProp : null;

    this.placeholder = (options.placeholder) ? options.placeholder : null;

    this.showPlaceholderOnEditIfEmpty = (options.showPlaceholderOnEditIfEmpty) ? options.showPlaceholderOnEditIfEmpty : null;

    this.canEdit = (options.canEdit !== undefined) ? options.canEdit : true;
    
    this.readMoreAfterHeightPx = (options.readMoreAfterHeightPx !== undefined) ? options.readMoreAfterHeightPx : 170;

  },

  ui: {
    mainfield: '.ckeditorField-mainfield',
    saveButton: '.ckeditorField-savebtn',
    cancelButton: '.ckeditorField-cancelbtn',
    seeMoreOrLess: '.js_seeMoreOrLess',
    seeMore: '.js_seeMore',
    seeLess: '.js_seeLess',
  },

  events: {
    'click @ui.mainfield': 'changeToEditMode',
    'click @ui.saveButton': 'saveEdition',
    'click @ui.cancelButton': 'cancelEdition',
    'click @ui.seeMore': 'seeMoreContent',
    'click @ui.seeLess': 'seeLessContent',
  },

  serializeData: function() {
    var textToShow = (this.showPlaceholderOnEditIfEmpty && !this.model.get(this.modelProp)) ? this.placeholder : this.model.get(this.modelProp);

    return {
      topId: this.topId,
      fieldId: this.fieldId,
      bottomId: this.bottomId,
      text: textToShow,
      editing: this.editing,
      canEdit: this.canEdit,
      placeholder: this.placeholder,
      hideButton: this.hideButton
    }
  },

  onRender: function() {
    this.destroy();
    if (this.editing) {
      this.startEditing();
    }
    if (this._viewIsAlreadyShown) {
      this.requestEllipsis();
    }
  },

  onShow: function() {
    this.requestEllipsis();
    this._viewIsAlreadyShown = true;
  },

  requestEllipsis: function() {
    var that = this;
    setTimeout(function() {
      that.ellipsis(that.ui.mainfield, that.ui.seeMore);
    }, 0);
  },

  ellipsis: function(sectionSelector, seemoreUi) {
    /* We use https://github.com/MilesOkeefe/jQuery.dotdotdot to show
     * Read More links for introduction preview
     */
    var that = this;
    sectionSelector.dotdotdot({
      after: seemoreUi,
      height: that.readMoreAfterHeightPx,
      callback: function(isTruncated, orgContent) {

        if (isTruncated) {
          that.ui.seeMore.removeClass('hidden');
        }
        else {
          that.ui.seeMore.addClass('hidden');
        }
      },
      watch: "window"
    });

  },

  seeMoreContent: function(e) {
    e.stopPropagation();
    e.preventDefault();

    this.ui.mainfield.trigger('destroy');
    this.ui.seeMore.addClass('hidden');
    this.ui.seeLess.removeClass('hidden');
  },

  seeLessContent: function(e) {
    e.stopPropagation();
    e.preventDefault();

    //This is absurd, but in seeMoreContent will not restore the "after:" 
    // element to it's original location so we need to re-render here in case 
    // seeMoreContent was called before

    this.render();
    
    this.ui.seeLess.addClass('hidden');

    this.ellipsis(this.ui.mainfield, this.ui.seeMore);
  },

  /**
   * set the templace in editing mode
   */
  startEditing: function() {
    var editingArea = this.$('#' + this.fieldId).get(0),
        that = this;

    var config = _.extend({}, this.CKEDITOR_CONFIG, {
      sharedSpaces: { top: this.topId, bottom: this.bottomId }
    });

    //CKEDITOR.basePath = window.location.origin +'/static/js/bower/ckeditor/';

    this.ckInstance = CKEDITOR.inline(editingArea, config);

    setTimeout(function() {
      if (Ctx.debugRender) {
        console.log("cKEditorField:startEditing() stealing browser focus");
      }
      editingArea.focus();
    }, 100);

    if (this.autosave) {

      this.ckInstance.element.on('blur', function() {
        /**
        * Firefox triggers the blur event if we paste (ctrl+v)
        * in the ckeditor, so instead of calling the function directly
        * we wait to see if the focus is still in the ckeditor
        */
        setTimeout(function() {

          if (!that.ckInstance.element) return;

          var hasFocus = $(that.ckInstance.element).is(":focus");

          if (!hasFocus) that.saveEdition();

        }, 100);

      });
    }
  },

  /**
   * Destroy the ckeditor instance
   */
  destroy: function() {
    this.ckInstance = null;
  },

  changeToEditMode: function() {
    if (this.canEdit) {
      this.editing = true;
      this.render();
    }
  },

  saveEdition: function(ev) {
    if (ev) {
      ev.stopPropagation();
    }

    var text = this.ckInstance.getData();
    text = $.trim(text);
    if (text != $.trim(this.placeholder) || Ctx.stripHtml(text) == '') {
      /* We never save placeholder values to the model */
      if (this.model.get(this.modelProp) != text) {
        /* Nor save to the database and fire change events
         * if the value didn't change from the model
         */
        this.model.save(this.modelProp, text, {
          success: function(model, resp) {
                    },
          error: function(model, resp) {
            console.error('ERROR: saveEdition', resp.toJSON());
          }
        });
        this.trigger('save', [this]);
      }
    }

    this.editing = false;
    this.render();
  },

  cancelEdition: function(ev) {
    if (ev) {
      ev.stopPropagation();
    }

    if (this.ckInstance) {
      var text = this.model.get(this.modelProp);
      this.ckInstance.setData(text);
    }

    this.editing = false;
    this.render();

    this.trigger('cancel', [this]);
  }

});

module.exports = cKEditorField;

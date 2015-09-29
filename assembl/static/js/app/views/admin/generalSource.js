var Marionette = require('../../shims/marionette.js'),
    i18n = require('../../utils/i18n.js'),
    CollectionManager = require('../../common/collectionManager.js'),
    Promise = require('bluebird');

var Source = Marionette.LayoutView.extend({
  template: '#tmpl-adminDiscussionSettingsGeneralSource',
  regions: {
    readOnly: '.source-read',
    form: '.source-edit'
  },

  onShow: function(){
    this.getRegion('readOnly').show(new ReadSource({model: this.model}));
    var form = this.model.collection.getViewClass(this.model.get('@type'));
    this.getRegion('form').show(new form({model: this.model}));
  }
});

var ReadSource = Marionette.ItemView.extend({
    template: '#tmpl-adminDiscussionSettingsGeneralSourceRead',
    ui: {
        manualStart: '.js_manualStart'
    },

    modelEvents: {
        'change': 'updateView'
    },

    events: {
        'click @ui.manualStart': 'manualStart'
    },

    manualStart: function(evt){
        console.log('A manual start event was clicked');
    },

    serializeData: function(){
        return {
            name: this.model.get('name')
        }
    },

    updateView: function(evt){
        this.render(); //Update 
    }
});


var DiscussionSourceList = Marionette.CollectionView.extend({
    childView: Source
});


module.exports = {
    Item: ReadSource,
    Root: Source,
    DiscussionSourceList: DiscussionSourceList
}

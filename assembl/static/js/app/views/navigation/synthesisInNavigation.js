define(function (require) {

    var AssemblPanel = require('views/assemblPanel'),
        CollectionManager = require('modules/collectionManager'),
        Types = require('utils/types'),
        Ctx = require('modules/context'),
        _ = require('underscore'),
        i18n = require('utils/i18n');

    var SynthesisInNavigationPanel = AssemblPanel.extend({
        template: '#tmpl-synthesisInNavigationPanel',
        panelType: 'synthesisNavPanel',
        className: 'synthesisNavPanel',

        ui: {
            synthesisList: ".synthesisList",
            synthesisListHeader: ".synthesisListHeader"
        },

        initialize: function (options) {
            this.groupContent = options.groupContent;
        },

        events: {
            'click .synthesisList > li': 'onSynthesisClick'
        },

        onRender: function () {
            var that = this,
                collectionManager = new CollectionManager();
            //console.log(this.groupContent.model);
            $.when(collectionManager.getAllMessageStructureCollectionPromise(), collectionManager.getAllSynthesisCollectionPromise()).done(
                function (allMessageStructureCollection, allSynthesisCollection) {
                    var synthesisMessages = allMessageStructureCollection.where({'@type': Types.SYNTHESIS_POST}),
                        html = '';
                    if (synthesisMessages.length > 0) {
                        _.sortBy(synthesisMessages, function (message) { return message.get('date'); });
                        synthesisMessages.reverse();
                        _.each(synthesisMessages, function (message) {
                            var synthesis = allSynthesisCollection.get(message.get('publishes_synthesis'));
                            html += "<li data-message-id=" + message.id + ">" + i18n.gettext("Synthesis of ") + Ctx.formatDate(message.get('date')) + " " + synthesis.get('subject') + "</li>";
                        });
                        that.ui.synthesisList.html(html);
                        that.displaySynthesis(synthesisMessages[0].id);
                        // TODO: Show that first entry is selected.
                    }
                    else {
                        that.ui.synthesisListHeader.html(i18n.gettext("No synthesis of the discussion has been published yet"));
                    }
                })

        },

        onSynthesisClick: function (ev) {
            this.displaySynthesis(ev.currentTarget.attributes['data-message-id'].value);
            // TODO: Show that entry is selected.
        },
        displaySynthesis: function (messageId) {
            messageListView = this.groupContent.getViewByTypeName('messageList');
            messageListView.currentQuery.clearAllFilters();
            messageListView.toggleFilterByPostId(messageId);
            // TODO: Make sure it's expanded
        },
    });


    return SynthesisInNavigationPanel;
});
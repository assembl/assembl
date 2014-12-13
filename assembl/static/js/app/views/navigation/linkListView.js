'use strict';

define(['backbone', 'underscore', 'jquery', 'backbone.marionette'],
    function (Backbone, _, $, Marionette) {

        var SimpleLinkView = Marionette.ItemView.extend({
            template: '#tmpl-simpleLink',
            initialize: function (options) {
                this.groupContent = options.groupContent;
            },
            ui: {
                'links': '.externalvizlink'
            },
            events: {
                'click @ui.links': 'linkClicked'
            },
            linkClicked: function(a) {
               this.groupContent.resetVisualizationState(this.model.get('url'));
            }
        }),
        LinkListView = Marionette.CollectionView.extend({
            childView: SimpleLinkView,
            initialize: function (options) {
                this.collection = options.collection;
                this.groupContent = options.groupContent;
                this.childViewOptions = {
                    'groupContent': options.groupContent
                };
            }
        });
        return LinkListView;
    });

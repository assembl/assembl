'use strict';

define(['backbone', 'underscore', 'jquery', 'bluebird', 'backbone.marionette', 'common/context', 'utils/permissions'],
    function (Backbone, _, $, Promise, Marionette, Ctx, Permissions) {

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
            getPermissionTokenPromise: function(discussion, permissions) {
              permissions = _.map(permissions, function(p){return "permission="+p;}).join("&");
              return Promise.resolve($.get(Ctx.getApiV2DiscussionUrl('perm_token')+"?"+permissions));
            },
            linkClicked: function(a) {
                var url = this.model.get('url'),
                    content = this.groupContent,
                    server_url = document.URL,
                    server_url_comp1 = document.URL.split('://', 2),
                    server_url_comp2 = server_url_comp1[1].split('/', 1),
                    url_base = server_url_comp1[0]+'://'+server_url_comp2[0]+'/data/Discussion/'+Ctx.getDiscussionId();
                Promise.join(
                    this.getPermissionTokenPromise([Permissions.READ_PUBLIC_CIF]),
                    this.getPermissionTokenPromise([Permissions.READ]),
                    function (cif_token, user_token) {
                        content.resetVisualizationState(_.template(url, {
                                "url": encodeURIComponent(url_base+'/jsonld?token='+cif_token),
                                "user_url": encodeURIComponent(url_base+'/private_jsonld?token='+user_token),
                                "lang": assembl_locale
                            }));
                    });
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

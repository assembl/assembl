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
            getPermissionTokenPromise: function(permissions, seed) {
              permissions = _.map(permissions, function(p){return "permission="+p;}).join("&");
              var url = Ctx.getApiV2DiscussionUrl('perm_token')+"?"+permissions;
              if (seed !== undefined)
                url += '&seed='+seed;
              return Promise.resolve($.get(url));
            },
            linkClicked: function(a) {
                var url = _.template(this.model.get('url')),
                    content = this.groupContent,
                    random_seed = String(Math.random()),
                    server_url = document.URL,
                    server_url_comp1 = document.URL.split('://', 2),
                    server_url_comp2 = server_url_comp1[1].split('/', 1),
                    url_base = server_url_comp1[0]+'://'+server_url_comp2[0]+'/data/Discussion/'+Ctx.getDiscussionId();
                Promise.join(
                    this.getPermissionTokenPromise([Permissions.READ_PUBLIC_CIF], random_seed),
                    this.getPermissionTokenPromise([Permissions.READ], random_seed),
                    function (cif_token, user_token) {
                        content.resetVisualizationState(url({
                                "url": encodeURIComponent(url_base+'/jsonld?token='+cif_token),
                                "user_url": encodeURIComponent(url_base+'/private_jsonld?callback=processCIFUserData&token='+user_token),
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

'use strict';

define(['models/base', 'common/context'], function (Base, Ctx) {

    var emailAccount = Base.Model.extend({
        urlRoot: '/data/User/'+ Ctx.getCurrentUserId() +'/accounts',
        idAttribute:'@id',
        defaults: {
          will_merge_if_validated: false,
          verified: false,
          profile: 0,
          preferred: false,
          '@type': '',
          '@id': '',
          'email': '',
          '@view': ''
        }

    });

    var emailAccounts = Base.Collection.extend({
        url: '/data/User/'+ Ctx.getCurrentUserId() +'/accounts',
        model: emailAccount
    });

    return {
        Model: emailAccount,
        Collection: emailAccounts
    };
});
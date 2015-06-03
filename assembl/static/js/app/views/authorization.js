'use strict';

var Marionette = require('../shims/marionette.js'),
    Ctx = require('../common/context.js');

var authorization = Marionette.ItemView.extend({
    template: '#tmpl-authorization',
    className: 'authorization',
    initialize: function(options){
        this.error = options.error;
        this.message = options.message;
    },
    serializeData: function(){
      return {
        error: this.error,
        message: this.message
      }
    },
    templateHelpers: function () {
        return {
            urlLogIn: function () {
                return '/login?next_view=/' + Ctx.getDiscussionSlug() + '/';
            }
        }
    }
});


module.exports = authorization;
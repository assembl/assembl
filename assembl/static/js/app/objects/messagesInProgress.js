'use strict';

var Marionette = require('../shims/marionette.js'),
    Ctx = require('../common/context.js');

var messagesInProgress = Marionette.Object.extend({

    _store: window.localStorage,
    _key: "composing_messages",
    _messages: null,

    getMessages: function() {
        if (this._messages !== null) {
            return this._messages;
        }
        Ctx.isNewUser();
        var messages = this._store.getItem(this._key);
        if (messages !== null) {
            messages = JSON.parse(messages);
        }
        if (messages == null) {
            messages = {};
        }
        this._messages = messages;
        return messages;
    },

    saveMessage: function(context, body, title) {
        /**
         * Gaby Hourlier 03-20-2014 : I don't really understand
         * why we have to get the previous messages saved instead of delete them
         * and why add them in the new localstorage of the new message saved
         *
         * benoitg 2015-03-24: We DO delete them if they are empty
         * */
        var messages = this.getMessages();
        if (!title) {
            title = '';
        }
        if (!body) {
            body = '';
        }
        if (title.length === 0 && body.length === 0) {
            delete messages[context];
        } else {
            messages[context] = {"body": body, "title": title};
        }
        window.localStorage.setItem(this._key, JSON.stringify(messages));
    },

    getMessage: function(context) {
        var messages = this.getMessages();
        if(messages[context] && messages[context]['body'] === "[object Object]") {
          console.warn("savePartialMessage() Fixing corrupted data in message storage (a past bug causes text representation of objects to be stored in local storage)")
          this.saveMessage(context, '', messages[context]['title']);
          return this.getMessage(context);
        }
        return messages[context] || {};
    },

    clearMessage: function(context) {
        var messages = this.getMessages();
        delete messages[context];
        window.localStorage.setItem(this._key, JSON.stringify(messages));
    }

})

module.exports = new messagesInProgress();

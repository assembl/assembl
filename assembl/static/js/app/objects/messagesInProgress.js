define(function (require) {

    var Ctx = require('common/context');

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
            var messages = this.getMessages();
            if (title === undefined) {
                title = '';
            }
            if (body === undefined) {
                console.error("save undefined message body");
                body = '';
            }
            if (title.length == 0 && body.length == 0) {
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
        },

    })

    return new messagesInProgress();
});
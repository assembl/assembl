define(['app', 'underscore', 'sockjs'], function(app, _, SockJS){
    'use strict';

    /**
     * @class Socket
     *
     * @param {string} url
     */
    var Socket = function(){
        this.socket = new SockJS(app.socket_url);
        this.socket.onopen = this.onOpen.bind(this);
        this.socket.onmessage = this.onMessage.bind(this);
        this.socket.onclose = this.onClose.bind(this);
        this.state = Socket.STATE_CLOSED;
    };

    /**
     * @const
     */
    Socket.STATE_CLOSED = 0;
    Socket.STATE_CONNECTING = 1;
    Socket.STATE_OPEN = 2;

    /**
     * Triggered when the connection opens
     * @event
     */
    Socket.prototype.onOpen = function(ev){
        this.socket.send("token:" + app.getCsrfToken());
        this.socket.send("discussion:" + app.discussionID);
        this.state = Socket.STATE_CONNECTING;
    };

    /**
     * Triggered when the client receives a message form server
     * @event
     */
    Socket.prototype.onMessage = function(ev){
        if (this.state == Socket.STATE_CONNECTING) {
            app.trigger('socket:open', [this.socket, ev]);
            this.state = Socket.STATE_OPEN;
        }
        var data = JSON.parse(ev.data),
            i = 0,
            len = data.length;

        for(; i<len; i += 1){
            this.processData(data[i]);
        }

        app.trigger('socket:message', [this.socket, data]);
    };

    /**
     * Triggered when the connection closes ( or lost the connection )
     * @event
     */
    Socket.prototype.onClose = function(ev){
        app.trigger('socket:close', [this.socket, ev]);
        this.state = Socket.STATE_CLOSED;
    };

    /**
     * Processes one item from a data array from the server
     * @param  {Object]} item
     */
    Socket.prototype.processData = function(item) {
        var collection = app.getCollectionByType(item),
            model;

        console.log( item['@id'], item );

        if( collection === null ){
            // TODO: Handle singletons like discussion etc.
            return;
        }

        model = collection.get(item['@id']);

        if( item['@tombstone'] ){
            //if( model ) model.before_delete();
            collection.remove(model);
            return;
        }

        // TODO André: the following fails. I see objects
        // without collection, and the prototype is "Surrogate".
        item = new collection.model(item);
        if( model === null ){
            // oops, doesn't exist
            collection.add(item);
            //model.after_add();
        } else {
            // yeah, it exists

            //model.before_update(item);
            collection.add(item, {merge: true});
        }
    };

    return Socket;
});

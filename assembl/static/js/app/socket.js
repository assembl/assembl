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
        this.state = 0;
    };

    /**
     * Triggered when the connection opens
     * @event
     */
    Socket.prototype.onOpen = function(ev){
        this.socket.send("token:" + app.getCsrfToken());
        this.socket.send("discussion:" + app.discussionID);
        this.state = 1;
    };

    /**
     * Triggered when the receives a message form server
     * @event
     */
    Socket.prototype.onMessage = function(ev){
        if (this.state == 1) {
            app.trigger('socket:open', [this.socket, ev]);
            this.state = 2;
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
        this.state = 0;
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
        if( model == null ){
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

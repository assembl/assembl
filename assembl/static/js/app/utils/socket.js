define(['app', 'underscore', 'sockjs'], function(app, _, SockJS){
    'use strict';

    /**
     * @class Socket
     *
     * @param {string} url
     */
    var Socket = function(){
        this.init();
    };

    /**
     * @const
     */
    Socket.STATE_CLOSED = 0;
    Socket.STATE_CONNECTING = 1;
    Socket.STATE_OPEN = 2;
    Socket.CONNECTION_TIMEOUT_TIME = 5000;

    /**
     * @init
     */
    Socket.prototype.init = function(){
        this.socket = new SockJS(app.socket_url);
        this.socket.onopen = this.onOpen.bind(this);
        this.socket.onmessage = this.onMessage.bind(this);
        this.socket.onclose = this.onClose.bind(this);
        this.state = Socket.STATE_CLOSED;
    };

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
        
        var that = this;
        window.setTimeout(function(){
            that.init();
        }, Socket.CONNECTION_TIMEOUT_TIME);
    };

    /**
     * Processes one item from a data array from the server
     * @param  {Object]} item
     */
    Socket.prototype.processData = function(item){
        var collection = app.getCollectionByType(item),
            model;

        if (app.debugSocket) {
            console.log( item['@id'] || item['@type'], item );
        }

        if( collection === null ){
            if(item['@type'] == "Connection") {
                //Ignore Connections
                return;
            } else {
                if (app.debugSocket) {
                    console.log("Socket.prototype.processData(): TODO: Handle singletons like discussion etc. for item:", item);
                }
                return;
            }

        }

        // Each collection must know what to do
        collection.updateFromSocket(item);
    };

    return Socket;
});

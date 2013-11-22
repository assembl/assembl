define(['app'], function(app, socketjs){
    'use strict';

    /**
     * @class Socket
     *
     * @param {string} url
     */
    var Socket = function(){
        this.socket = new SockJS('http://localhost:8080/');

        this.socket.onopen = this.onOpen.bind(this);
        this.socket.onmessage = this.onMessage.bind(this);
        this.socket.onclose = this.onClose.bind(this);
    };

    /**
     * Triggered when the connection opens
     * @event
     */
    Socket.prototype.onOpen = function(ev){
        app.trigger('socket:open', [this.socket, ev]);
    };

    /**
     * Triggered when the receives a message form server
     * @event
     */
    Socket.prototype.onMessage = function(ev){
        app.trigger('socket:message', [this.socket, ev]);
    };

    /**
     * Triggered when the connection closes ( or lost the connection )
     * @event
     */
    Socket.prototype.onClose = function(ev){
        app.trigger('socket:close', [this.socket, ev]);
    };

    return Socket;
});
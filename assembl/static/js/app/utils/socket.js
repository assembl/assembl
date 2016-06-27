'use strict';
/**
 * 
 * @module app.utils.socket
 */

var _ = require('underscore'),
    SockJS = require('sockjs-client'),
    App = require('../app.js'),
    Ctx = require('../common/context.js');

/**
 * @class Socket
 *
 * @param {string} url
 */
var Socket = function(connectCallback) {
  this.connectCallback = connectCallback;
  if (start_application) {
    this.init();
  }
};

/**
 * @const
 */
Socket.STATE_CLOSED = 0;
Socket.STATE_CONNECTING = 1;
Socket.STATE_OPEN = 2;
Socket.RECONNECTION_WAIT_TIME = 5000;

/**
 * @init
 */
Socket.prototype.init = function() {
  if (Ctx.debugSocket) {
    console.log("Socket::init()");
  }
  this.socket = new SockJS(Ctx.getSocketUrl());
  this.socket.onopen = this.onOpen.bind(this);
  this.socket.onmessage = this.onMessage.bind(this);
  this.socket.onclose = this.onClose.bind(this);
  this.socket.onerror = this.onError.bind(this);
  if (Ctx.debugSocket) {
    console.log("Socket::init() state is now STATE_CLOSED");
  }
  this.state = Socket.STATE_CLOSED;
};

/**
 * Triggered when the connection opens
 * 
 * Note that the actual backbone event App.vent.trigger('socket:open')
 * is actually sent in Socket.prototype.onMessage
 * @event
 */
Socket.prototype.onOpen = function(ev) {
  if (Ctx.debugSocket) {
    console.log("Socket::onOpen()");
  }
  this.socket.send("token:" + Ctx.getCsrfToken());
  this.socket.send("discussion:" + Ctx.getDiscussionId());
  if (Ctx.debugSocket) {
    console.log("Socket::onOpen() state is now STATE_CONNECTING");
  }
  this.state = Socket.STATE_CONNECTING;
};

/**
 * Triggered when a socket error occurs
 * @event
 */
Socket.prototype.onError = function(ev) {
  if (true || Ctx.debugSocket) {
    console.log("Socket::onError() an error occured in the websocket");
  }
};

/**
 * Triggered when the client receives a message from the server
 * @event
 */
Socket.prototype.onMessage = function(ev) {
  if (Ctx.debugSocket) {
    console.log("Socket::onMessage()");
  }
  if (this.state === Socket.STATE_CONNECTING) {
    this.connectCallback(this);
    App.vent.trigger('socket:open');
    if (Ctx.debugSocket) {
      console.log("Socket::onOpen() state is now STATE_OPEN");
    }
    this.state = Socket.STATE_OPEN;
  }

  var data = JSON.parse(ev.data),
      i = 0,
      len = data.length;

  for (; i < len; i += 1) {
    this.processData(data[i]);
  }

  App.commands.execute('socket:message');
};

/**
 * Triggered when the connection closes ( or lost the connection )
 * @event
 */
Socket.prototype.onClose = function(ev) {
  if (Ctx.debugSocket) {
    console.log("Socket::onClose()");
  }
  if (Ctx.debugSocket) {
    console.log("Socket::onClose() state is now STATE_CLOSED");
  }
  this.state = Socket.STATE_CLOSED;
  App.vent.trigger('socket:close');

  var that = this;
  window.setTimeout(function() {
    if (Ctx.debugSocket) {
      console.log("Socket::onClose() attempting to reconnect");
    }
    that.init();
  }, Socket.RECONNECTION_WAIT_TIME);
};

/**
 * Processes one item from a data array from the server
 * @param  {Object} item
 */
Socket.prototype.processData = function(item) {
  var CollectionManager = require('../common/collectionManager.js'),
      collectionManager = new CollectionManager(),
      collPromise = collectionManager.getCollectionPromiseByType(item);

  if (Ctx.debugSocket) {
    console.log("On socket:", item['@type'], item['@id'], item);
  }

  if (collPromise === null) {
    if (item['@type'] == "Connection") {
      //Ignore Connections
      return;
    } 
    else {
      if (Ctx.debugSocket) {
        console.log("Socket.prototype.processData(): TODO: Handle socket events for items of type:", item['@type'], item);
      }
      return;
    }
  }

  // Each collection must know what to do
  collPromise.done(function(collection) {
    collection.updateFromSocket(item);
  });
};

module.exports = Socket;

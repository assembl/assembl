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
    };

    /**
     * Triggered when the connection opens
     * @event
     */
    Socket.prototype.onOpen = function(ev){
        this.socket.send("discussion:" + app.discussionID);
        app.trigger('socket:open', [this.socket, ev]);
    };

    /**
     * Triggered when the receives a message form server
     * @event
     */
    Socket.prototype.onMessage = function(ev){
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
    };

    /**
     * Processes one item from a data array from the server
     * @param  {Object]} item
     */
    Socket.prototype.processData = function(item) {
        var collection = app.getCollectionByType(item),
            model;

        if( collection === null ){
            return;
        }

        model = collection.get(item['@id']);

        if( item['@tombstone'] ){
            //if( model) model.before_delete();
            collection.remove(model);
            return;
        }

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


    /**
     * Methods related to the type of data sent from server
     * @type {Object}
     */
    var _methods = {

        /**
         * Processes Extract data
         * @param  {Object} item
         */
        "Extract": function(item){
            if( !app.segmentList ){
                return;
            }

            var id = extractId(item['@id']),
                segment = app.segmentList.segments.get(id),
                model;

            if( segment ){
                // Update
                segment.fetch();
                return
            }

            // Create
            model = new app.segmentList.segments.model({
                id: extractId(item['@id']),
                text: item['body'],
                quote: item['body'],
                idPost: extractId(item["source"]),
                idIdea: null,
                creationDate: item['creation_date'],
                idCreator: extractId(item['creator']),
                ranges: [{
                    'start': item['text_fragment_identifiers'][0]['xpath_start'],
                    'offset_start': item['text_fragment_identifiers'][0]['offset_start'],
                    'end': item['text_fragment_identifiers'][0]['xpath_end'],
                    'offset_end': item['text_fragment_identifiers'][0]['offset_end'],
                }],
                target: null
            });

            app.segmentList.segments.add(model);
            
            // TODO: Delete
        },

        /**
         * Processes Mailbox data
         * @param {Object} item
         */
        "Mailbox": function(item){
            if( !app.messageList ){
                return;
            }

            console.log('Mailbox', item);

            // Create
            // Update
            // Delete
        }
    };

    return Socket;
});

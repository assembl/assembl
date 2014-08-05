define(function (require) {

    var Marionette = require('marionette');

    var storage = Marionette.Object.extend({

        _store: window.localStorage,

        createGroupItem: function(items){
            var data = [],
                collection = [],
                groups = {},
                that = this;

            //FIXME: viewId need to be uniq to delete the right storage group

            if(items.length){
                items.forEach(function(item){
                    var i = {};
                    i.type = item;

                    data.push(i);
                });
            }

            groups.panels = data;

            if(!this._store.getItem('groupItems')){

                collection.push(groups);
                this._store.setItem('groupItems', JSON.stringify(collection));

            } else {

                var groupOfItems = JSON.parse(this._store.getItem('groupItems'));
                groupOfItems.push(groups);

                this._store.removeItem('groupItems');
                this._store.setItem('groupItems', JSON.stringify(groupOfItems));
            }

            setTimeout(function(){

                that.scrollToRight();

            }, 2000);

        },

        getStorageGroupItem: function(){
            if(this._store.getItem('groupItems')){
                return JSON.parse(this._store.getItem('groupItems'));
            }
        },

        scrollToRight: function(){
            var left = $('#groupContainer').width();

            $('#groupContainer').animate({ scrollLeft: left}, 1000);
        }

    })

    return new storage();
});
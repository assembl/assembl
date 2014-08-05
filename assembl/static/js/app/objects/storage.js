define(function (require) {

    var Marionette = require('marionette'),
        groupSpec = require('models/groupSpec');

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

            groups.group = data;

            if(!this._store.getItem('groupItems')){

                collection.push(groups);
                this._store.setItem('groupItems', JSON.stringify(collection));

            } else {

                var groupOfItems = JSON.parse(this._store.getItem('groupItems'));
                groupOfItems.push(groups);

                this._store.removeItem('groupItems');
                this._store.setItem('groupItems', JSON.stringify(groupOfItems));
            }

            //this.getGroupItem();

            setTimeout(function(){

                that.scrollToRight();

            }, 2000);

        },

        getStorageGroupItem: function(){
            var data = null;

            if(!this._store.getItem('groupItems')){

                var defaults = [
                    {
                        group:[
                            {type:'navigation'},
                            //{type:'idea-list'},
                            {type:'idea-panel'},
                            {type:'message'},
                        ]
                    },
                    {
                        group:[
                            {type:'navigation'},
                            //{type:'idea-list'},
                            //{type:'idea-panel'},
                            //{type:'message'},
                        ]
                    }
                ];

                //Set default group
                this._store.setItem('groupItems', JSON.stringify(defaults));

                data = JSON.parse(this._store.getItem('groupItems'));

            } else {

                data = JSON.parse(this._store.getItem('groupItems'));
            }
            return new groupSpec.Collection(data, {'parse':true});
        },

        scrollToRight: function(){
            var left = $('#groupContainer').width();

            $('#groupContainer').animate({ scrollLeft: left}, 1000);
        }

    })

    return new storage();
});